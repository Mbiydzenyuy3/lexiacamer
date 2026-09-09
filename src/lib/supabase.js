import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase client, or null when no backend is configured.
 *
 * The app has to run with NO backend at all — that is how it works today, and
 * it is what a child on a school tablet with no account still gets. So every
 * caller must handle `supabase === null`, and the offline path is the default
 * rather than a fallback bolted on later.
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

export const supabase = isBackendConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isBackendConfigured && import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '[lexia] No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — running fully offline.'
  );
}
