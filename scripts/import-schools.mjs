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
import { adminClient } from './lib/admin-client.mjs';

// --dry-run fetches and parses without writing, so the Overpass half can be
// checked without credentials.
const dryRun = process.argv.includes('--dry-run');
const db = dryRun ? null : adminClient();

// Overpass rejects Node's default agent with 406 Not Acceptable. curl works,
// which makes this look like a query problem when it is purely the header.
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'LexiaCamer/1.0 (school directory import; +https://lexiacamer.com)',
  Accept: 'application/json',
};

// Mirrors, tried in order. The main instance is often busy.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

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

let payload = null;
for (const endpoint of ENDPOINTS) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(QUERY),
      headers: HEADERS,
    });
    if (res.ok) { payload = await res.json(); break; }
    // Say what actually came back rather than guessing at the cause.
    const body = (await res.text()).slice(0, 200).replace(/\s+/g, ' ');
    console.error(`  ${endpoint} -> ${res.status} ${res.statusText}`);
    if (body) console.error(`    ${body}`);
    if (res.status === 429 || res.status === 504) {
      console.error('    (busy or timed out, trying the next mirror)');
    }
  } catch (e) {
    console.error(`  ${endpoint} -> ${e.message}`);
  }
}
if (!payload) {
  console.error('\nEvery Overpass mirror failed. Wait a few minutes and retry.');
  process.exit(1);
}
const { elements = [] } = payload;
console.log(`  ${elements.length} elements returned.`);

// OSM is user-contributed and some nodes tagged amenity=school are plainly
// not schools. Picking a wrong one grants nothing, so this is presentation
// rather than safety, but a parent should not be offered an internet cafe as
// their child's school. Deliberately a short list: over-filtering would drop
// real schools, and the free-text fallback covers whatever is missed.
const NOT_A_SCHOOL = [
  'internet cafe', 'cyber', 'hotel', 'restaurant', 'bar ', 'guest house',
  'pharmacy', 'boutique', 'garage', 'filling station', 'petrol',
  'market', 'supermarket', 'hair', 'salon', 'barber',
];

// Many entries are typed in lower case. Title-case those so the list reads
// consistently, while leaving names that already have capitals alone.
const tidyName = (n) => (n === n.toLowerCase()
  ? n.replace(/\b[a-z]/g, (c) => c.toUpperCase())
  : n);

const rows = elements
  .filter((e) => {
    const n = e.tags?.name?.trim();
    if (!n || n.length < 3) return false;
    const lower = n.toLowerCase();
    return !NOT_A_SCHOOL.some((bad) => lower.includes(bad));
  })
  .map((e) => ({
    name: tidyName(e.tags.name.trim()).slice(0, 200),
    town: (e.tags['addr:city'] || e.tags['addr:town'] || '').trim().slice(0, 120) || null,
    region: (e.tags['addr:state'] || e.tags['addr:region'] || '').trim().slice(0, 120) || null,
    source: 'osm',
    external_ref: `${e.type}/${e.id}`,
    lat: e.lat ?? e.center?.lat ?? null,
    lon: e.lon ?? e.center?.lon ?? null,
  }));

console.log(`  ${rows.length} look like schools with a usable name.`);
if (!rows.length) process.exit(0);

if (dryRun) {
  console.log('\nDry run, nothing written. A sample:');
  for (const r of rows.slice(0, 8)) {
    console.log(`  ${r.name}${r.town ? ` (${r.town})` : ''}`);
  }
  process.exit(0);
}

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
