#!/usr/bin/env node
/**
 * List invites and their state.
 *
 *   npm run admin:invites
 *
 * redeem_invite() deliberately returns ONE message for invalid, expired,
 * already-used and wrong-recipient, so a person holding a token learns
 * nothing. That is right for them and useless for you, so this is how you find
 * out which it actually was.
 */
import { adminClient } from './lib/admin-client.mjs';

const db = adminClient();

const { data: invites, error } = await db
  .from('invites')
  .select('id, email, role, school_id, expires_at, redeemed_at, created_at')
  .order('created_at', { ascending: false })
  .limit(25);
if (error) { console.error('Failed:', error.message); process.exit(1); }

if (!invites?.length) {
  console.log('\nNo invites exist. Run: npm run admin:onboard-school\n');
  process.exit(0);
}

const { data: schools } = await db.from('schools').select('id, name');
const schoolName = (id) => schools?.find((s) => s.id === id)?.name || id;

const now = Date.now();
console.log('\nInvites (newest first)\n' + '='.repeat(22));
for (const i of invites) {
  const state = i.redeemed_at
    ? `USED ${new Date(i.redeemed_at).toLocaleString()}`
    : new Date(i.expires_at).getTime() < now
      ? `EXPIRED ${new Date(i.expires_at).toLocaleDateString()}`
      : 'OPEN';
  console.log(`  ${state.padEnd(28)} ${i.role.padEnd(9)} ${i.email}`);
  console.log(`  ${''.padEnd(28)} ${schoolName(i.school_id)}`);
}

console.log(`
An OPEN invite only works for the exact email shown. Sign in as that address,
not another one. If it is USED or EXPIRED, issue a new one:

  npm run admin:onboard-school
`);

// The signed-in accounts, so a mismatch is obvious side by side.
const { data: users } = await db.auth.admin.listUsers();
if (users?.users?.length) {
  console.log('Accounts that have signed in:');
  for (const u of users.users) console.log(`  ${u.email}`);
  console.log('');
}
