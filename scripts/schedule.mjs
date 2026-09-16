#!/usr/bin/env node
/**
 * Put the generated posts into the Facebook Page's schedule.
 *
 *   npm run schedule                    show what WOULD be scheduled
 *   npm run schedule -- --confirm       actually schedule it
 *   npm run schedule -- --lang fr       French captions (default)
 *   npm run schedule -- --date 2026-09-16   a specific batch
 *
 * Posts are created UNPUBLISHED with a future publish time, so they land in
 * Business Suite's Planner where you review, edit or delete them before they
 * ever go live. Nothing here publishes immediately, and nothing touches
 * Instagram -- the Instagram API needs images at a public URL rather than a
 * file upload, which is a different job.
 *
 * DRY RUN BY DEFAULT. Posting to a real page in front of real people is not
 * something a script should do because you pressed up-arrow and enter, so the
 * default prints the plan and stops. `--confirm` is the deliberate act.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { env } from './lib/admin-client.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const fmtEarly = (d) => d.toLocaleString('en-GB',
  { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const API = 'https://graph.facebook.com/v21.0';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const has = (n) => argv.includes(`--${n}`);

const TOKEN = env.META_PAGE_TOKEN;
const PAGE_ID = env.META_PAGE_ID;
const LANG = arg('lang', 'fr') === 'en' ? 'en' : 'fr';
const CONFIRM = has('confirm');

if (!TOKEN || !PAGE_ID) {
  console.error('\n  Missing META_PAGE_TOKEN or META_PAGE_ID in .env.admin.');
  console.error('  Run `npm run meta:check` for the details.\n');
  process.exit(1);
}

/* ——— Which batch ——— */

const contentDir = resolve(ROOT, 'content');
const batches = existsSync(contentDir)
  ? readdirSync(contentDir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  : [];
const batch = arg('date', batches[batches.length - 1]);
if (!batch) {
  console.error('\n  No content to schedule. Run `npm run posts` first.\n');
  process.exit(1);
}
const dir = resolve(contentDir, batch);

/* ——— Already scheduled? ——— */

// Meta has no natural idempotency key for a scheduled post, so a second run
// would happily create eight duplicates. This records what went out.
const ledgerPath = resolve(dir, '.scheduled.json');
const ledger = existsSync(ledgerPath)
  ? JSON.parse(readFileSync(ledgerPath, 'utf8'))
  : {};

/* ——— The posts, and when they go out ——— */

/**
 * The dates come from schedule.json, written by `npm run posts`.
 *
 * This file used to re-derive them, and the two copies disagreed immediately:
 * calendar.md said Thursday, the scheduler said Friday. Whoever owns the
 * cadence should own it alone.
 */
const planPath = resolve(dir, 'schedule.json');
if (!existsSync(planPath)) {
  console.error(`
  No schedule.json in content/${batch}.

  It is written by \`npm run posts\`. Regenerate the batch:
      npm run posts
`);
  process.exit(1);
}
const plan = JSON.parse(readFileSync(planPath, 'utf8'));

const posts = plan.map((entry) => ({
  key: entry.key,
  at: new Date(entry.at),
  message: (() => {
    const f = resolve(dir, `${entry.key}.${LANG}.txt`);
    return existsSync(f) ? readFileSync(f, 'utf8').trim() : null;
  })(),
  image: resolve(dir, `${entry.key}.png`),
})).filter((p) => {
  if (!p.message) { console.log(`  ! ${p.key}: no ${LANG} caption, skipped`); return false; }
  if (!existsSync(p.image)) { console.log(`  ! ${p.key}: no image, skipped`); return false; }
  // Meta rejects a publish time under ten minutes away, and a slot from an
  // older batch may simply have passed.
  if (p.at.getTime() < Date.now() + 15 * 60000) {
    console.log(`  ! ${p.key}: ${fmtEarly(p.at)} is in the past, skipped`);
    return false;
  }
  return true;
});

const pending = posts.filter((p) => !ledger[p.key]);
const when = pending.map((p) => p.at);

console.log(`\n  Batch:    content/${batch}`);
console.log(`  Language: ${LANG.toUpperCase()}`);
console.log(`  Page:     ${PAGE_ID}\n`);

if (!pending.length) {
  console.log(posts.length
    ? '  Everything in this batch is already scheduled.\n'
    : '  Nothing to schedule.\n');
  process.exit(0);
}

const fmt = (d) => d.toLocaleString('en-GB',
  { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

pending.forEach((p, i) => {
  console.log(`  ${String(i + 1).padStart(2, '0')}  ${fmt(when[i])}  ${p.key}`);
  console.log(`      ${p.message.split('\n')[0].slice(0, 62)}`);
});

if (Object.keys(ledger).length) {
  console.log(`\n  (${Object.keys(ledger).length} already scheduled, skipped)`);
}

if (!CONFIRM) {
  console.log(`
  This was a DRY RUN. Nothing has been scheduled.

  To do it for real:
    npm run schedule -- --confirm

  Posts are created unpublished, so they appear in Business Suite's
  Planner where you can review, edit or delete them before they go live.
`);
  process.exit(0);
}

/* ——— Do it ——— */

console.log('\n  Scheduling...\n');

async function upload(imagePath) {
  const form = new FormData();
  form.append('source', new Blob([readFileSync(imagePath)]), basename(imagePath));
  form.append('published', 'false');
  form.append('access_token', TOKEN);
  const res = await fetch(`${API}/${PAGE_ID}/photos`, { method: 'POST', body: form });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return body.id;
}

async function schedulePost(message, photoId, at) {
  const form = new FormData();
  form.append('message', message);
  form.append('attached_media[0]', JSON.stringify({ media_fbid: photoId }));
  form.append('published', 'false');
  form.append('scheduled_publish_time', String(Math.floor(at.getTime() / 1000)));
  form.append('access_token', TOKEN);
  const res = await fetch(`${API}/${PAGE_ID}/feed`, { method: 'POST', body: form });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return body.id;
}

let done = 0;
for (let i = 0; i < pending.length; i += 1) {
  const p = pending[i];
  try {
    // eslint-disable-next-line no-await-in-loop
    const photoId = await upload(p.image);
    // eslint-disable-next-line no-await-in-loop
    const postId = await schedulePost(p.message, photoId, when[i]);
    ledger[p.key] = { postId, at: when[i].toISOString(), lang: LANG };
    writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
    console.log(`  \x1b[32m✓\x1b[0m ${p.key} → ${fmt(when[i])}`);
    done += 1;
  } catch (e) {
    console.log(`  \x1b[31m✗\x1b[0m ${p.key}: ${e.message}`);
    if (/expired|session|OAuth/i.test(e.message)) {
      console.log('\n    The token is no longer valid. Run `npm run meta:check`.\n');
      break;
    }
  }
}

// Reporting "they are in Planner" after scheduling nothing is the kind of
// cheerful lie that sends someone hunting through a UI for posts that were
// never created. Say what actually happened.
if (done === pending.length) {
  console.log(`
  ${done} of ${pending.length} scheduled.

  They are in Business Suite → Planner, unpublished, for you to review.
  Nothing is live until its scheduled time.
`);
} else if (done > 0) {
  console.log(`
  ${done} of ${pending.length} scheduled; ${pending.length - done} failed.

  The ones that succeeded are in Planner. Fix the errors above and run
  again -- the ledger means the successful ones will not be repeated.
`);
} else {
  console.log(`
  Nothing was scheduled. Planner will be empty.

  If every line above mentions a missing permission, the token needs it.
  Publishing to a Page requires BOTH of these, not just the first:

      pages_manage_posts
      pages_read_engagement

  Generate a new System User token with both ticked, then:
      npm run meta:check
`);
}
