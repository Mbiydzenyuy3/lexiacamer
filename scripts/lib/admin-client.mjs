/**
 * Shared setup for the admin scripts.
 *
 * These all need the service-role key, and all need to fail the same clear way
 * without it. Three copies of this drifted apart once already: two printed a
 * helpful message and the third threw a raw stack trace at the user.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Anchored to the repo root, not the working directory. */
const ROOT = resolve(import.meta.dirname, '../..');

export function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return i === -1 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
      .filter(Boolean)
  );
}

export const env = {
  ...loadEnv(resolve(ROOT, '.env')),
  ...loadEnv(resolve(ROOT, '.env.admin')),
  ...process.env,
};

/**
 * A client with the service-role key, or a clear exit explaining how to get
 * one. Never returns a half-configured client.
 */
export function adminClient() {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(`
Missing credentials.

Create a file called .env.admin in the project root, containing:

  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

Get it from the Supabase dashboard: Settings -> API. It is the key labelled
"secret" (older projects call it service_role), NOT the publishable one.

  ${url ? 'Project URL:  found in .env' : 'Project URL:  MISSING from .env'}
  ${key ? 'Secret key:   found' : 'Secret key:   MISSING'}

.env.admin is gitignored. This key must never go in .env, because everything
in .env is compiled into the browser bundle, and this key bypasses every
row-level security policy in the project.
`);
    process.exit(1);
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
