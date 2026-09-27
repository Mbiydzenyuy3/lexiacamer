#!/usr/bin/env node
/**
 * What early testers said.
 *
 *   npm run admin:feedback
 *
 * Service-role only, from your machine. There is deliberately no admin screen
 * in the deployed app: that would be a permanent surface protecting every
 * record, for a convenience a command already covers.
 */
import { adminClient } from './lib/admin-client.mjs';
const db = adminClient();

/**
 * Feedback is written by anyone, with no character restrictions, and printed
 * straight to a terminal. ANSI escapes in a message can clear the screen or
 * overwrite lines above -- hiding other testers' reports, or faking output.
 */
const safe = (v) => String(v ?? '').replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');

const bail = (what, error) => {
  console.error(`\nCould not read ${what}: ${error.message}`);
  console.error('This is a connection or permission problem, NOT an empty database.\n');
  process.exit(1);
};

const { data: testers, error: tErr } = await db.from('testers')
  .select('role,name,whatsapp,email,wants_help_with,created_at')
  .order('created_at', { ascending: false });
if (tErr) bail('testers', tErr);

console.log(`\nEarly testers (${testers?.length || 0})\n` + '='.repeat(24));
for (const t of testers || []) {
  console.log(`  ${safe(t.role).padEnd(8)} ${safe(t.name).padEnd(20)} ${safe(t.whatsapp || t.email || '')}`);
}
if (testers?.length) {
  const byGoal = {};
  for (const t of testers) if (t.wants_help_with) byGoal[t.wants_help_with] = (byGoal[t.wants_help_with] || 0) + 1;
  const ranked = Object.entries(byGoal).sort((a, b) => b[1] - a[1]);
  if (ranked.length) {
    // The most useful thing here: what people actually came for, which may
    // not be what the app currently leads with.
    console.log('\n  What they came for:');
    for (const [g, n] of ranked) console.log(`    ${String(n).padStart(3)}  ${g}`);
  }
}

const { data: fb, error: fErr } = await db.from('feedback')
  .select('screen,category,rating,message,user_agent,created_at')
  .order('created_at', { ascending: false }).limit(50);
if (fErr) bail('feedback', fErr);

console.log(`\nFeedback (${fb?.length || 0} most recent)\n` + '='.repeat(24));
for (const f of fb || []) {
  const ua = f.user_agent || '';
  const device = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'other';
  console.log(`  [${(f.category || '').padEnd(10)}] ${(f.rating || '-').padEnd(9)} ${(f.screen || '?').padEnd(16)} ${device}`);
  if (f.message) console.log(`      "${safe(f.message)}"`);
}

if (fb?.length) {
  const counts = {};
  for (const f of fb) counts[f.category] = (counts[f.category] || 0) + 1;
  console.log('\n  By category:');
  for (const [c, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)}  ${c}`);
  }
}
console.log('');
