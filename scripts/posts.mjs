#!/usr/bin/env node
/**
 * Facebook posts, written to disk ready to schedule.
 *
 *   npm run posts                 four weeks, starting today
 *   npm run posts -- --weeks 2    a shorter batch
 *   npm run posts -- --no-data    skip the database entirely
 *   npm run posts -- --lang fr    French only (default writes both)
 *
 * This does NOT post anything. Meta Business Suite already schedules posts for
 * free, weeks ahead, and reimplementing that through the Graph API would mean a
 * Meta app, a long-lived page token and App Review before the first post could
 * go out. The actual bottleneck is having something worth posting twice a week,
 * so that is what this automates.
 *
 * Output per run, in content/<date>/:
 *   calendar.md          what to post when, with the text inline to copy
 *   NN-key.en.txt        the post, English
 *   NN-key.fr.txt        the post, French
 *   NN-key.png           the image, 1200x630
 *
 * Nothing here invents a number. Posts that cite data declare what they need
 * and are dropped from the batch when the database cannot back them up.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

/** Anchored to the repo, so the script works from any working directory. */
const ROOT = resolve(import.meta.dirname, '..');
import { env } from './lib/admin-client.mjs';
import { POSTS } from './lib/post-library.mjs';
import { CARDS, render, canRasterise } from './lib/post-cards.mjs';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const WEEKS = Math.max(1, Math.min(12, Number(arg('weeks', 4)) || 4));
const LANGS = (arg('lang') ? [arg('lang')] : ['en', 'fr'])
  .filter((l) => l === 'en' || l === 'fr');
if (!LANGS.length) { console.error('  --lang must be en or fr.\n'); process.exit(1); }
const PER_WEEK = 2;   // What one person can actually sustain.

/** The only answers the app offers, and so the only ones we will ever print. */
const GOALS = new Set(['Letter sounds', 'Reading words', 'Spelling',
                       'Confidence', 'Not sure yet']);

/* ——— 1. What is actually true right now ——— */

async function gather() {
  const blank = { testers: 0, feedback: 0, topWant: null };
  if (has('no-data')) return blank;

  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('  No service-role key, so data-backed posts are skipped.');
    console.log('  (That is fine — the evergreen posts do not need one.)\n');
    return blank;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const d = { ...blank };
  let reachable = true;

  try {
    // count:'exact' rather than data.length: PostgREST caps a plain select at
    // max-rows (1000 by default), so the length silently plateaus and the
    // published figure would stop growing without anyone noticing.
    const { data, count, error } = await db.from('testers')
      .select('wants_help_with', { count: 'exact' });
    // supabase-js returns query errors in the result rather than throwing, so
    // the catch below never saw them. Without this, an expired key or an
    // unreachable project reads as "the database is empty" -- the worst
    // possible failure after launch, because it looks like nobody signed up.
    if (error) throw error;
    if (data) {
      d.testers = count ?? data.length;
      const counts = {};
      for (const t of data) if (t.wants_help_with) counts[t.wants_help_with] = (counts[t.wants_help_with] || 0) + 1;
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      // Only call something "the most common answer" when it actually leads.
      // A tie is not a finding, and posting it as one would be a small lie.
      //
      // The allowlist is the important half. This value goes into the text of
      // a post that a human pastes onto Facebook, and the column is writable
      // by anyone holding the public anon key. 0020 constrains it in the
      // database; this re-checks it here, because a database written before
      // that migration -- or by a future policy change -- must never be able
      // to put arbitrary text under the brand's name.
      if (top && top[1] > 1 && GOALS.has(top[0])) d.topWant = top[0];
    }
  } catch (e) { reachable = note(e, 'testers', reachable); }

  try {
    const { count, error } = await db.from('feedback')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    d.feedback = count || 0;
  } catch (e) { reachable = note(e, 'feedback', reachable); }

  // "Could not reach the database" and "the database is empty" must never
  // print the same sentence.
  if (!reachable) {
    console.error('\n  Could not read from Supabase. Data-backed posts are skipped,');
    console.error('  and the figures below are NOT a real reading of an empty database.\n');
  }
  return d;
}

/** A missing table is expected on some branches; anything else is a problem. */
function note(e, table, reachable) {
  const msg = String(e?.message || e);
  const missing = /does not exist|schema cache|not find the table/i.test(msg);
  if (missing) return reachable;              // fine: table not on this branch
  console.error(`  ! ${table}: ${msg}`);
  return false;
}

/* ——— 2. Choose and order the batch ——— */

function schedule(data, slots) {
  const usable = POSTS.filter((p) => !p.needs || p.needs(data));
  const dropped = POSTS.length - usable.length;

  const asks = usable.filter((p) => p.ask);
  const rest = usable.filter((p) => !p.ask);

  // Rotate rather than repeat: a page that posts the same thing twice in a
  // month looks automated, which is the one thing this must not look like.
  const out = [];
  let ri = 0, ai = 0;
  for (let i = 0; i < slots; i += 1) {
    // Roughly one ask in three, and never two in a row.
    const wantAsk = i % 3 === 2 && asks.length > 0;
    if (wantAsk) { out.push(asks[ai % asks.length]); ai += 1; }
    else if (rest.length) { out.push(rest[ri % rest.length]); ri += 1; }
    else { out.push(asks[ai % asks.length]); ai += 1; }
  }
  return { out, dropped, pool: usable.length };
}

/** Tuesday and Friday: two fixed days beat a cadence nobody keeps. */
function postingDays(weeks) {
  const days = [];
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  while (days.length < weeks * PER_WEEK) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd === 2 || wd === 5) days.push(new Date(d));
  }
  return days;
}

const fmt = (d) => d.toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long',
});

/* ——— 3. Write it out ——— */

const data = await gather();
const days = postingDays(WEEKS);
const { out, dropped, pool } = schedule(data, days.length);

const stamp = new Date().toISOString().slice(0, 10);
const dir = resolve(ROOT, 'content', stamp);
// Cleared, not merged: running --weeks 4 and then --weeks 1 would otherwise
// leave posts 03-08 on disk that calendar.md no longer mentions.
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const rasterise = canRasterise();
if (!rasterise) {
  console.log('  No headless Chrome found, so the cards are written as HTML.');
  console.log('  Open each .html and screenshot it at 1200x630.\n');
}

const lines = [
  `# LexiaCamer — ${WEEKS} week${WEEKS > 1 ? 's' : ''} of posts`,
  '',
  `Generated ${stamp}. Two posts a week, Tuesday and Friday.`,
  '',
  'Paste into Meta Business Suite → Create post → Schedule. Each post has an',
  'English and a French version; post whichever fits the audience you are',
  'reaching, or alternate week by week.',
  '',
  data.testers || data.feedback
    ? `Live figures used: ${data.testers} testers, ${data.feedback} pieces of feedback.`
    : 'No live figures were available, so only evergreen posts are included.',
  '',
  '---',
  '',
];

let made = 0;
for (let i = 0; i < out.length; i += 1) {
  const post = out[i];
  const n = String(i + 1).padStart(2, '0');
  const base = `${n}-${post.key}`;

  const [cardKind, cardProps] = typeof post.card === 'function' ? post.card(data) : post.card;
  const html = CARDS[cardKind](cardProps);
  const png = resolve(dir, `${base}.png`);
  const ok = render(html, resolve(dir, `${base}.html`), png);
  if (ok) made += 1;

  lines.push(`## ${n}. ${fmt(days[i])}${post.ask ? '  · asks for something' : ''}`);
  lines.push('');
  lines.push(`Image: \`${base}.png\`${ok ? '' : ' (render `' + base + '.html` yourself)'}`);
  lines.push('');

  for (const lang of LANGS) {
    const body = typeof post[lang] === 'function' ? post[lang](data) : post[lang];
    writeFileSync(resolve(dir, `${base}.${lang}.txt`), `${body}\n`);
    lines.push(`<details><summary><b>${lang.toUpperCase()}</b></summary>`);
    lines.push('');
    lines.push('```');
    lines.push(body);
    lines.push('```');
    lines.push('</details>');
    lines.push('');
  }
  lines.push('---');
  lines.push('');
}

writeFileSync(resolve(dir, 'calendar.md'), lines.join('\n'));

console.log(`\n  ${out.length} posts written to content/${stamp}/`);
console.log(`  ${made} images rendered, ${pool} posts in the pool.`);
if (dropped) {
  console.log(`  ${dropped} data-backed post${dropped > 1 ? 's' : ''} skipped: not enough real data yet.`);
}
console.log(`\n  Start here:  content/${stamp}/calendar.md\n`);
