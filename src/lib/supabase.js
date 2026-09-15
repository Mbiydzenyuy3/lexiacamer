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
export async function retryPendingTester() {
  let record = null;
  try {
    const raw = localStorage.getItem('lexia_tester_pending');
    if (!raw) return;
    record = JSON.parse(raw);
  } catch { return; }

  const sb = await getSupabase();
  if (!sb) return;
  try {
    const { error } = await sb.from('testers').insert(record);
    if (!error) localStorage.removeItem('lexia_tester_pending');
  } catch { /* still unreachable; try again next load */ }
}
