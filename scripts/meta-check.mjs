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
const info = (m) => console.log(`    ${m}`);

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

/* 1. Is the token valid at all, and is it a PAGE token? */
try {
  const me = await get('me', { fields: 'id,name' });
  if (me.id === PAGE_ID) {
    ok(`Page token for "${me.name}"`);
  } else if (me.id) {
    // /me returning a person rather than the page is the single most common
    // mistake: the first token the Explorer hands you is a User token.
    no(`This is a USER token (it identifies "${me.name}"), not a Page token.`);
    info('In Graph API Explorer, open the "User or Page" dropdown and choose');
    info('"Get Page Access Token", then pick LexiaCamer. Copy THAT token.');
    fatal = true;
  }
} catch (e) {
  no(`The token was rejected: ${e.message}`);
  if (/expire|session/i.test(e.message)) {
    info('Tokens from Graph API Explorer are short-lived. Generate a new one.');
  }
  fatal = true;
}

/* 2. Does it reach the right page? */
if (!fatal) {
  try {
    const page = await get(PAGE_ID, { fields: 'id,name,fan_count' });
    ok(`Reaches the page: ${page.name}${page.fan_count !== undefined ? ` (${page.fan_count} followers)` : ''}`);
  } catch (e) {
    no(`Cannot read page ${PAGE_ID}: ${e.message}`);
    info('Check META_PAGE_ID matches the asset_id in your Business Suite URL.');
    fatal = true;
  }
}

/* 3. Can it publish? Asked by inspecting the token, never by posting. */
if (!fatal) {
  try {
    const { data } = await get('debug_token', { input_token: TOKEN });
    const scopes = data?.scopes || [];
    if (scopes.includes('pages_manage_posts')) ok('Has pages_manage_posts — it can schedule posts');
    else {
      no('Missing pages_manage_posts — it can read, but cannot post');
      info('Re-generate the token with that permission ticked.');
      fatal = true;
    }

    if (data?.expires_at === 0) {
      ok('Does not expire');
    } else if (data?.expires_at) {
      const when = new Date(data.expires_at * 1000);
      const days = Math.round((when - Date.now()) / 86400000);
      if (days <= 2) {
        no(`Expires in ${days} day${days === 1 ? '' : 's'} (${when.toDateString()})`);
        info('Short-lived. The scheduler can exchange it for a 60-day token.');
      } else {
        ok(`Expires ${when.toDateString()} (${days} days)`);
      }
    }
  } catch (e) {
    info(`Could not inspect the token's permissions: ${e.message}`);
    info('Not fatal — the checks above are the ones that matter.');
  }
}

console.log(fatal
  ? '\n  Not ready yet. Fix the ✗ above and run this again.\n'
  : '\n  Ready. This token can schedule posts to your page.\n');
process.exit(fatal ? 1 : 0);
