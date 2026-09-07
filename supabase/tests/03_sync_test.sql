-- ============================================================================
-- DEVICE GRANT + SYNC SUITE
--
-- The write path into a child's record. Every case here is an attack against
-- the one credential that lives on an unattended classroom machine.
-- ============================================================================

\set ON_ERROR_STOP on

-- --- mint a token as the parent of the home child ---------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-000000000001');
select issue_device_grant('30000000-0000-0000-0000-000000000001') as tok \gset

-- Checked as superuser: the table itself is unreadable to clients by design,
-- so counting it as `authenticated` would report 0 whether or not it worked.
reset role;
select expect_count('S01 guardian can mint a device token',
       (select count(*) from device_grants
         where student_id = '30000000-0000-0000-0000-000000000001'), 1);

-- The raw token must NOT be recoverable from the table.
select expect_count('S02 only the hash is stored, never the token',
       (select count(*) from device_grants where token_hash = :'tok'), 0);

-- --- a stranger cannot mint a token for someone else's child ----------------
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_denied('S03 stranger cannot mint a token for a child', $sql$
  select issue_device_grant('30000000-0000-0000-0000-000000000001') $sql$);

-- --- sync works unauthenticated (kid mode has no session) -------------------
reset role;
set role anon;
select test_as(null);

select expect_count('S04 device can append its own activity',
       (select sync_activity(:'tok', jsonb_build_array(jsonb_build_object(
          'id', '50000000-0000-0000-0000-000000000001',
          'kind', 'word_completed',
          'occurred_at', now()::text)))), 1);

-- Replaying the same batch must not double-count.
select expect_count('S05 replayed batch is idempotent',
       (select sync_activity(:'tok', jsonb_build_array(jsonb_build_object(
          'id', '50000000-0000-0000-0000-000000000001',
          'kind', 'word_completed',
          'occurred_at', now()::text)))), 0);

-- --- the token cannot write for a different student -------------------------
-- The payload names another child; the function must ignore it entirely.
select expect_count('S06 token writes only for its own student',
       (select sync_activity(:'tok', jsonb_build_array(jsonb_build_object(
          'id', '50000000-0000-0000-0000-000000000002',
          'student_id', '30000000-0000-0000-0000-0000000000a1',
          'kind', 'word_completed',
          'occurred_at', now()::text)))), 1);
reset role;
select expect_count('S07 the smuggled student_id was ignored',
       (select count(*) from activity_events
         where id = '50000000-0000-0000-0000-000000000002'
           and student_id = '30000000-0000-0000-0000-000000000001'), 1);

-- --- back-dating into a previous school's window is refused -----------------
set role anon;
select expect_count('S08 back-dated event before the grant is dropped',
       (select sync_activity(:'tok', jsonb_build_array(jsonb_build_object(
          'id', '50000000-0000-0000-0000-000000000003',
          'kind', 'word_completed',
          'occurred_at', '2026-01-01')))), 0);

select expect_count('S09 future-dated event is dropped',
       (select sync_activity(:'tok', jsonb_build_array(jsonb_build_object(
          'id', '50000000-0000-0000-0000-000000000004',
          'kind', 'word_completed',
          'occurred_at', (now() + interval '10 days')::text)))), 0);

-- --- a bad token gets nothing ----------------------------------------------
select expect_denied('S10 invalid token is rejected', $sql$
  select sync_activity(repeat('a', 64), '[]'::jsonb) $sql$);
select expect_denied('S11 short token is rejected', $sql$
  select sync_activity('x', '[]'::jsonb) $sql$);

-- --- batch size is capped ---------------------------------------------------
select expect_denied('S12 oversized batch is refused', $sql$
  select sync_activity('$sql$ || :'tok' || $sql$',
    (select jsonb_agg(jsonb_build_object(
       'id', gen_random_uuid(), 'kind', 'word_completed',
       'occurred_at', now()::text))
       from generate_series(1, 501))) $sql$);

-- --- the device can READ nothing -------------------------------------------
select test_as(null);
select expect_count('S13 device session reads no students',
       (select count(*) from students), 0);
select expect_count('S14 device session reads no activity',
       (select count(*) from activity_events), 0);

-- --- revocation is immediate ------------------------------------------------
reset role;
set role authenticated;
select test_as('00000000-0000-0000-0000-000000000001');
select expect_count('S18 guardian can list devices for their child',
       (select count(*) from list_device_grants('30000000-0000-0000-0000-000000000001')), 1);
select revoke_device_grant((select id
    from list_device_grants('30000000-0000-0000-0000-000000000001') limit 1));

set role anon;
select test_as(null);
select expect_denied('S15 revoked token stops working immediately', $sql$
  select sync_activity('$sql$ || :'tok' || $sql$', '[]'::jsonb) $sql$);

-- --- expiry is enforced -----------------------------------------------------
reset role;
set role authenticated;
select test_as('00000000-0000-0000-0000-000000000001');
select issue_device_grant('30000000-0000-0000-0000-000000000001') as tok2 \gset
reset role;
update device_grants set expires_at = now() - interval '1 day'
 where token_hash = encode(digest(:'tok2', 'sha256'), 'hex');

set role anon;
select test_as(null);
select expect_denied('S16 expired token is rejected', $sql$
  select sync_activity('$sql$ || :'tok2' || $sql$', '[]'::jsonb) $sql$);

reset role;

-- A stranger must not be able to enumerate a child's devices.
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_count('S19 stranger cannot list a child''s devices',
       (select count(*) from list_device_grants('30000000-0000-0000-0000-000000000001')), 0);
reset role;

-- --- anon must not be able to mint tokens at all ----------------------------
set role anon;
select test_as(null);
select expect_denied('S17 anon cannot mint a device token', $sql$
  select issue_device_grant('30000000-0000-0000-0000-000000000001') $sql$);
reset role;
