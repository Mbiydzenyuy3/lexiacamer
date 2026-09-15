/**
 * The Supabase client — loaded on demand, never at startup.
 *
 * The app has to run with NO backend at all: that is how it works today, and
 * it is what a child on a school tablet with no account still gets. So every
 * caller must handle a null client, and the offline path is the default rather
 * than a fallback bolted on later.
 *
 * WHY THIS IS A DYNAMIC IMPORT. @supabase/supabase-js is around 35KB gzipped.
 * Someone who opens the landing page over a weak connection in a rural area
 * needs exactly none of it: they are reading a page. They need it only if they
 * fill in the tester form or send feedback, by which point the page is already
 * up and the download is invisible. Paying 35KB before first paint, on a
 * connection where that is measured in seconds, to support an action most
 * visitors never take, is the wrong trade.
 *
 * Only the ANON key belongs here. It ships in the browser bundle and is public
 * by design; RLS is what protects the data. The service-role key must never
 * appear in this file or anywhere else in src/.
 */

const url = import.meta.env?.VITE_SUPABASE_URL;

// Supabase renamed the browser-safe key from "anon" to "publishable". Accept
// either, so copying straight from the dashboard works whichever name it shows.
const anonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isBackendConfigured = Boolean(url && anonKey);

let clientPromise = null;

/**
 * Resolves to the client, or to null when there is no backend configured.
 * The module is fetched once and cached; later calls are instant.
 */
export function getSupabase() {
  if (!isBackendConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }))
      // A failed chunk fetch (flaky network, cache miss offline) must not throw
      // into a caller that is mid-submit. It behaves exactly like "no backend".
      .catch(() => { clientPromise = null; return null; });
  }
  return clientPromise;
}

/**
 * Warm the client in the background, without blocking anything.
 *
 * Called when a visitor reaches the tester form, so the module is usually
 * already there by the time they press the button. Idle time on a slow
 * connection is the cheapest time to spend.
 */
export function warmSupabase() {
  if (isBackendConfigured) getSupabase();
}

if (!isBackendConfigured && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '[lexia] No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: running fully offline.'
  );
}

/**
 * Re-send a signup that could not be stored when it was made.
 *
 * Called once on load. Quiet on purpose: a tester should never be told about
 * our retry, and a second failure simply leaves it for next time.
 *
 * Reads localStorage BEFORE touching the client, so the common case — nothing
 * pending — costs nothing and downloads nothing.
 */
/**
 * A duplicate primary key means the row is ALREADY THERE, which is success.
 *
 * This is how idempotency is achieved without an upsert. PostgREST's upsert
 * needs UPDATE permission, and these tables are deliberately insert-only --
 * granting UPDATE so a retry could work would let anyone edit anyone else's
 * row, which is a far worse trade than a duplicate. So the client generates
 * the id, a retry of an insert that already landed collides on the primary
 * key, and 23505 is read as "saved".
 */
const alreadySaved = (error) =>
  !error || error.code === '23505' || /duplicate key/i.test(error.message || '');

const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_MAX_TRIES = 5;

function bumpTries(record) {
  try {
    const tries = (record.tries || 0) + 1;
    if (tries >= PENDING_MAX_TRIES) localStorage.removeItem('lexia_tester_pending');
    else localStorage.setItem('lexia_tester_pending', JSON.stringify({ ...record, tries }));
  } catch { /* ignore */ }
}

export async function retryPendingTester() {
  let record = null;
  try {
    const raw = localStorage.getItem('lexia_tester_pending');
    if (!raw) return;
    record = JSON.parse(raw);
  } catch {
    // Unparseable: drop it rather than leaving something we cannot read and
    // will therefore never clear.
    try { localStorage.removeItem('lexia_tester_pending'); } catch { /* ignore */ }
    return;
  }

  // This record is a real person's name and phone number. If it has not gone
  // anywhere in a week it is not going to, and keeping it on what may be a
  // shared family phone is worse than losing one contact.
  const { savedAt, tries, ...payload } = record;
  if (savedAt && Date.now() - savedAt > PENDING_TTL_MS) {
    try { localStorage.removeItem('lexia_tester_pending'); } catch { /* ignore */ }
    return;
  }

  const sb = await getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('testers').insert(payload);
    if (alreadySaved(error)) { localStorage.removeItem('lexia_tester_pending'); return; }
    // A permanent rejection must not mean a failing round trip on EVERY app
    // load forever -- that is the exact cost the lazy client exists to avoid,
    // inflicted on the slowest connections.
    bumpTries(record);
  } catch { /* still unreachable; try again next load */ }
}

/**
 * Re-send feedback that could not be stored when it was written.
 *
 * The tester signup has always had this; feedback did not, which was the wrong
 * way round. On an app whose headline feature is working offline, the most
 * valuable reports are precisely the ones written while offline -- and those
 * were the ones being dropped, behind a message saying "Thank you. That is
 * exactly what helps."
 *
 * Feedback carries no contact details, so unlike a tester record it is not
 * personal data sitting on a shared phone. It still expires, because an
 * observation about a build from two months ago helps nobody.
 */
const FEEDBACK_KEY = 'lexia_feedback_pending';
const FEEDBACK_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const FEEDBACK_MAX = 20;

export function queueFeedback(row) {
  try {
    const q = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
    q.push({ ...row, savedAt: Date.now() });
    // Bounded: a tester hammering the button offline must not fill their
    // storage quota and break the app they are trying to report on.
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(q.slice(-FEEDBACK_MAX)));
  } catch { /* private browsing; the note is simply lost */ }
}

export function unqueueFeedback(id) {
  try {
    const q = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
    const left = q.filter((r) => r.id !== id);
    if (left.length) localStorage.setItem(FEEDBACK_KEY, JSON.stringify(left));
    else localStorage.removeItem(FEEDBACK_KEY);
  } catch { /* ignore */ }
}

export async function retryPendingFeedback() {
  let queue = [];
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return;
    queue = JSON.parse(raw);
    if (!Array.isArray(queue) || !queue.length) {
      localStorage.removeItem(FEEDBACK_KEY);
      return;
    }
  } catch {
    try { localStorage.removeItem(FEEDBACK_KEY); } catch { /* ignore */ }
    return;
  }

  const fresh = queue.filter((r) => !r.savedAt || Date.now() - r.savedAt < FEEDBACK_TTL_MS);
  if (!fresh.length) {
    try { localStorage.removeItem(FEEDBACK_KEY); } catch { /* ignore */ }
    return;
  }

  const sb = await getSupabase();
  if (!sb) return;
  try {
    // One at a time: a batch insert fails wholesale if any single row is a
    // duplicate from a previous partial send, which would strand the rest.
    let allDone = true;
    for (const { savedAt, ...row } of fresh) {
      // eslint-disable-next-line no-await-in-loop
      const { error } = await sb.from('feedback').insert(row);
      if (!alreadySaved(error)) allDone = false;
    }
    if (allDone) localStorage.removeItem(FEEDBACK_KEY);
  } catch { /* still unreachable; try again next load */ }
}
