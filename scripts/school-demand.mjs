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
import { adminClient, env } from './lib/admin-client.mjs';

const db = adminClient();

const { data, error } = await db.rpc('school_demand');
if (error) { console.error('Failed:', error.message); process.exit(1); }
if (!data?.length) { console.log('No schools requested yet.'); process.exit(0); }

console.log('\nSchools parents asked for\n' + '='.repeat(25));
for (const r of data) {
  console.log(`  ${String(r.parents).padStart(3)} parent(s)  ${r.raw_name}${r.town ? ` (${r.town})` : ''}`);
}
console.log('');
