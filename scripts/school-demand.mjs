#!/usr/bin/env node
/**
 * Where the demand is: schools parents named that are not on the platform yet.
 *
 *   npm run admin:school-demand
 *
 * This is the ranked list of schools to go and pitch, built from parents who
 * looked for their school and did not find it. Service-role only, from your
 * machine.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

const loadEnv = (f) => existsSync(f)
  ? Object.fromEntries(readFileSync(f, 'utf8').split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};

const env = { ...loadEnv('.env'), ...loadEnv('.env.admin'), ...process.env };
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

const { data, error } = await db.rpc('school_demand');
if (error) { console.error('Failed:', error.message); process.exit(1); }
if (!data?.length) { console.log('No schools requested yet.'); process.exit(0); }

console.log('\nSchools parents asked for\n' + '='.repeat(25));
for (const r of data) {
  console.log(`  ${String(r.parents).padStart(3)} parent(s)  ${r.raw_name}${r.town ? ` (${r.town})` : ''}`);
}
console.log('');
