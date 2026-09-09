#!/usr/bin/env node
/**
 * Import Cameroonian schools into the DIRECTORY from OpenStreetMap.
 *
 *   npm run admin:import-schools
 *
 * These land in school_directory, NOT in schools. A directory entry is a name
 * on a map: it grants nothing, has no director, and cannot see a child. Only
 * an entry you later verify and promote becomes a tenant.
 *
 * Coverage is whatever OSM has, which is real but incomplete. That is why the
 * onboarding keeps a free-text fallback: if a parent cannot find their school
 * here either, they type it and it becomes a lead.
 *
 * Data (c) OpenStreetMap contributors, ODbL. Attribute it if you display it
 * publicly.
 */
import { adminClient, env } from './lib/admin-client.mjs';

const db = adminClient();

const QUERY = `
[out:json][timeout:300];
area["ISO3166-1"="CM"][admin_level=2]->.cm;
(
  node["amenity"="school"]["name"](area.cm);
  way["amenity"="school"]["name"](area.cm);
  relation["amenity"="school"]["name"](area.cm);
);
out center tags;`;

console.log('Fetching schools in Cameroon from OpenStreetMap...');
console.log('(this takes a minute or two)');

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: 'data=' + encodeURIComponent(QUERY),
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
if (!res.ok) {
  console.error(`Overpass returned ${res.status}. It rate-limits; wait and retry.`);
  process.exit(1);
}
const { elements = [] } = await res.json();
console.log(`  ${elements.length} elements returned.`);

const rows = elements
  .filter((e) => e.tags?.name?.trim())
  .map((e) => ({
    name: e.tags.name.trim().slice(0, 200),
    town: (e.tags['addr:city'] || e.tags['addr:town'] || '').trim().slice(0, 120) || null,
    region: (e.tags['addr:state'] || e.tags['addr:region'] || '').trim().slice(0, 120) || null,
    source: 'osm',
    external_ref: `${e.type}/${e.id}`,
    lat: e.lat ?? e.center?.lat ?? null,
    lon: e.lon ?? e.center?.lon ?? null,
  }));

console.log(`  ${rows.length} have a usable name.`);
if (!rows.length) process.exit(0);

// Upsert on (source, external_ref) so re-running refreshes rather than
// duplicating, and never touches verified_school_id on entries you promoted.
let done = 0;
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500);
  const { error } = await db.from('school_directory')
    .upsert(batch, { onConflict: 'source,external_ref', ignoreDuplicates: false });
  if (error) { console.error('Failed:', error.message); process.exit(1); }
  done += batch.length;
  process.stdout.write(`\r  imported ${done}/${rows.length}`);
}
console.log('\nDone. Parents can now find these when they type.');
