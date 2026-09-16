#!/usr/bin/env node
/**
 * Does the Meta page token actually work?
 *
 *   npm run meta:check
 *
 * Getting a Page token involves half a dozen screens where it is easy to end
 * up holding something that looks like a token and is not: a User token rather
 * than a Page one, a token for the wrong page, or one whose permissions were
 * approved without the page actually being ticked. Every one of those fails
 * later, at the point of posting, with an error that does not say which of the
 * six screens went wrong.
 *
 * So this asks Meta three questions and reports them in plain words. It only
 * reads; it cannot post, schedule or change anything.
 */
import { env } from './lib/admin-client.mjs';

const TOKEN = env.META_PAGE_TOKEN;
const PAGE_ID = env.META_PAGE_ID;
const API = 'https://graph.facebook.com/v21.0';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const no = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const info2 = (m) => console.log(`    ${m}`);

if (!TOKEN || !PAGE_ID) {
  console.error(`
Missing credentials in .env.admin

Add both of these:

  META_PAGE_TOKEN=EAAG...        the Page token from Graph API Explorer
  META_PAGE_ID=1255878034284793  the asset_id from your Business Suite URL

  ${TOKEN ? 'META_PAGE_TOKEN: found' : 'META_PAGE_TOKEN: MISSING'}
  ${PAGE_ID ? 'META_PAGE_ID:    found' : 'META_PAGE_ID:    MISSING'}
`);
  process.exit(1);
}

async function get(path, params = {}) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', TOKEN);
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (body.error) throw Object.assign(new Error(body.error.message), body.error);
  return body;
}

console.log('\nChecking the Meta page token\n' + '='.repeat(28) + '\n');

let fatal = false;

/**
 * Identity comes from debug_token, NOT from /me.
 *
 * /me?fields=name looks like the obvious way to ask "what is this token?", and
 * it is a trap: reading a Page's name requires pages_read_engagement, which
 * posting does not. Checking that way made the checker demand a permission the
 * real task never uses, and fail a token that works perfectly.
 *
 * debug_token inspects the token itself -- its type, the object it belongs to,
 * its scopes and its expiry -- and needs no permission on the page at all.
 */
let info;
try {
  const { data } = await get('debug_token', { input_token: TOKEN });
  info = data || {};
} catch (e) {
  no(`The token was rejected: ${e.message}`);
  if (/expire|session/i.test(e.message)) info2('It has expired. Generate a new one.');
  process.exit(1);
}

const type = (info.type || '').toUpperCase();
const scopes = info.scopes || [];

/* 1. Page token, or the user token it is derived from? */
if (type === 'PAGE' && String(info.profile_id) === String(PAGE_ID)) {
  ok(`Page token for page ${PAGE_ID}`);
} else if (type === 'PAGE') {
  no(`Page token, but for page ${info.profile_id}, not ${PAGE_ID}.`);
  info2('Check META_PAGE_ID against the asset_id in your Business Suite URL.');
  fatal = true;
} else {
  no(`This is a ${type || 'USER'} token, not a Page token.`);
  try {
    const { data: pages = [] } = await get('me/accounts', { fields: 'id,name,access_token' });
    const mine = pages.find((p) => String(p.id) === String(PAGE_ID));
    if (mine?.access_token) {
      console.log('');
      ok('Recovered the Page token for you. Put this in .env.admin:');
      console.log('');
      console.log(`    META_PAGE_TOKEN=${mine.access_token}`);
      console.log('');
      info2('Then run this again.');
    } else if (pages.length) {
      info2(`This token administers: ${pages.map((p) => `${p.name} (${p.id})`).join(', ')}`);
      info2(`None match META_PAGE_ID=${PAGE_ID}.`);
    } else {
      info2('It administers no pages. On the approval screen the page was not');
      info2('ticked, or the system user has no role on it.');
    }
  } catch (e) {
    info2(`Could not look up its pages: ${e.message}`);
    info2('It needs pages_show_list to do that.');
  }
  fatal = true;
}

/* 2. Can it post? The only permission that actually matters here. */
if (!fatal) {
  if (scopes.includes('pages_manage_posts')) {
    ok('Has pages_manage_posts — it can schedule posts');
  } else {
    no(`Missing pages_manage_posts. It has: ${scopes.join(', ') || 'nothing'}`);
    info2('Regenerate the token with that permission ticked.');
    fatal = true;
  }
}

/* 3. How long it lasts. */
if (!fatal) {
  if (!info.expires_at) {
    ok('Does not expire');
  } else {
    const at = new Date(info.expires_at * 1000);
    const days = Math.round((at - Date.now()) / 86400000);
    if (days <= 2) {
      no(`Expires in ${days} day${days === 1 ? '' : 's'} (${at.toDateString()})`);
      info2('Generate a System User token with expiration set to Never.');
    } else {
      ok(`Expires ${at.toDateString()} (${days} days)`);
    }
  }
}

console.log(fatal
  ? '\n  Not ready yet. Fix the ✗ above and run this again.\n'
  : '\n  Ready. This token can schedule posts to your page.\n');
process.exit(fatal ? 1 : 0);
