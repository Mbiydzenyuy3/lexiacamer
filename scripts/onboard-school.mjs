#!/usr/bin/env node
/**
 * Onboard a verified school.
 *
 *   npm run admin:onboard-school
 *
 * Runs on YOUR machine with the service-role key, never in the browser. That
 * key bypasses every RLS policy in the project, so it is the one credential
 * that can see every child's record. It lives in .env.admin, which is
 * gitignored, and nowhere else.
 *
 * There is deliberately no admin UI. At a handful of schools a month, a phone
 * call and this command is less friction than a screen to maintain, and it
 * keeps the ability to mint access to any school out of the deployed app
 * entirely.
 *
 * This creates the school and the first director's invite. It does NOT verify
 * anything: verification is the human step you did before running it, and the
 * note you type is the record of what you checked.
 */
import { adminClient, env } from './lib/admin-client.mjs';

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomBytes, createHash } from 'node:crypto';

const db = adminClient();
const rl = createInterface({ input: stdin, output: stdout });

const ask = async (q, { required = true } = {}) => {
  for (;;) {
    const a = (await rl.question(q)).trim();
    if (a || !required) return a;
    console.log('  (required)');
  }
};

try {
  console.log('\nOnboard a verified school\n' + '='.repeat(25));
  console.log('Verify the institution BEFORE running this. This command only');
  console.log('records what you already checked.\n');

  const name = await ask('School name: ');
  const town = await ask('Town: ', { required: false });
  const email = (await ask("First director's email: ")).toLowerCase();
  const note = await ask('What did you verify? (kept on the record): ');
  const verifier = await ask('Verified by (your name): ');

  console.log(`\n  ${name}${town ? `, ${town}` : ''}`);
  console.log(`  Director invite to: ${email}`);
  const ok = (await ask('\nCreate this school? (yes/no): ')).toLowerCase();
  if (ok !== 'yes' && ok !== 'y') {
    console.log('Cancelled. Nothing was created.');
    process.exit(0);
  }

  const { data: school, error: schoolError } = await db
    .from('schools')
    .insert({
      name,
      town: town || null,
      status: 'active',
      verified_by: verifier,
      verified_at: new Date().toISOString(),
      verification_note: note,
    })
    .select()
    .single();
  if (schoolError) throw schoolError;

  // The raw token is shown once and only its hash is stored, so a database
  // leak does not hand anybody a working invite.
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();

  const { error: inviteError } = await db.from('invites').insert({
    token_hash: tokenHash,
    email,
    school_id: school.id,
    role: 'director',
    expires_at: expiresAt,
  });
  if (inviteError) throw inviteError;

  const base = env.APP_URL || 'http://localhost:5173';
  console.log(`
Created.

  School:   ${school.name}${school.town ? `, ${school.town}` : ''}
  ID:       ${school.id}
  Verified: ${verifier} - ${note}

Give the director this link. It expires in 14 days, works once, and only for
${email}:

  ${base}/invite/${token}

The token is not stored, only its hash, so this is the only time you will see
it. If it is lost, run this again to issue a new invite.
`);
} catch (err) {
  console.error('\nFailed:', err.message || err);
  process.exit(1);
} finally {
  rl.close();
}
