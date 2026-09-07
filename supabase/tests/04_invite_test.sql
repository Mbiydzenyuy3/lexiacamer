-- ============================================================================
-- INVITE SUITE
--
-- Invites are the only route into a school's data, so every failure mode here
-- is a way someone could acquire access to children they have no relationship
-- with.
-- ============================================================================

\set ON_ERROR_STOP on

-- A fresh teacher who belongs to no school yet.
reset role;
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000c1', 'newteacher@test'),
       ('00000000-0000-0000-0000-0000000000c2', 'wrongperson@test');

set role authenticated;

-- --- only a director may invite --------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000a1');   -- a teacher
select expect_denied('I01 a teacher cannot invite anyone', $sql$
  select create_invite('10000000-0000-0000-0000-00000000000a',
                       'newteacher@test', 'teacher') $sql$);

select test_as('00000000-0000-0000-0000-0000000000ff');   -- an outsider
select expect_denied('I02 an outsider cannot invite into a school', $sql$
  select create_invite('10000000-0000-0000-0000-00000000000a',
                       'newteacher@test', 'teacher') $sql$);

select test_as('00000000-0000-0000-0000-00000000000b');   -- director of B
select expect_denied('I03 a director cannot invite into another school', $sql$
  select create_invite('10000000-0000-0000-0000-00000000000a',
                       'newteacher@test', 'teacher') $sql$);

-- --- a director cannot scope an invite onto another school's class ---------
select test_as('00000000-0000-0000-0000-00000000000a');   -- director of A
select expect_denied('I04 invite cannot name another school''s class', $sql$
  select create_invite('10000000-0000-0000-0000-00000000000a',
                       'newteacher@test', 'teacher',
                       '20000000-0000-0000-0000-0000000000b1') $sql$);

-- --- the happy path ---------------------------------------------------------
select create_invite('10000000-0000-0000-0000-00000000000a',
                     'newteacher@test', 'teacher',
                     '20000000-0000-0000-0000-0000000000a2') as inv \gset

reset role;
select expect_count('I05 only the hash is stored, never the token',
       (select count(*) from invites where token_hash = :'inv'), 0);
set role authenticated;

-- --- a forwarded invite is useless to the wrong recipient -------------------
select test_as('00000000-0000-0000-0000-0000000000c2');   -- wrongperson@test
select expect_denied('I06 forwarded invite is rejected', $sql$
  select redeem_invite('$sql$ || :'inv' || $sql$') $sql$);
select expect_count('I07 the wrong recipient gained no membership',
       (select count(*) from school_members
         where profile_id = '00000000-0000-0000-0000-0000000000c2'), 0);

-- --- the intended recipient redeems it --------------------------------------
select test_as('00000000-0000-0000-0000-0000000000c1');   -- newteacher@test
select expect_count('I08 before redeeming, the teacher sees nothing',
       (select count(*) from students), 0);

select redeem_invite(:'inv');

select expect_count('I09 redeeming grants exactly one class',
       (select count(*) from students), 1);
select expect_count('I10 and only that class''s student',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000a2'), 1);
select expect_count('I11 not the other class in the same school',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000a1'), 0);

-- --- single use -------------------------------------------------------------
select expect_denied('I12 an invite cannot be redeemed twice', $sql$
  select redeem_invite('$sql$ || :'inv' || $sql$') $sql$);

-- --- an invited teacher still cannot invite ---------------------------------
select expect_denied('I13 the newly invited teacher cannot invite', $sql$
  select create_invite('10000000-0000-0000-0000-00000000000a',
                       'someone@test', 'teacher') $sql$);

-- --- expiry ------------------------------------------------------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select create_invite('10000000-0000-0000-0000-00000000000a',
                     'newteacher@test', 'teacher') as inv2 \gset
reset role;
update invites set expires_at = now() - interval '1 day'
 where token_hash = encode(digest(:'inv2', 'sha256'), 'hex');
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000c1');
select expect_denied('I14 an expired invite is rejected', $sql$
  select redeem_invite('$sql$ || :'inv2' || $sql$') $sql$);

-- --- revocation --------------------------------------------------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select create_invite('10000000-0000-0000-0000-00000000000a',
                     'newteacher@test', 'teacher') as inv3 \gset
select expect_count('I15 director can list outstanding invites',
       (select count(*) from list_invites('10000000-0000-0000-0000-00000000000a')), 3);
select revoke_invite((select id
    from list_invites('10000000-0000-0000-0000-00000000000a')
   where redeemed_at is null and expires_at > now() limit 1));
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000c1');
select expect_denied('I16 a revoked invite is rejected', $sql$
  select redeem_invite('$sql$ || :'inv3' || $sql$') $sql$);

-- --- a teacher cannot enumerate a school's invites --------------------------
select expect_count('I17 a teacher cannot list invites',
       (select count(*) from list_invites('10000000-0000-0000-0000-00000000000a')), 0);

-- --- removing a member closes their windows immediately ---------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select remove_school_member('10000000-0000-0000-0000-00000000000a',
                            '00000000-0000-0000-0000-0000000000c1');
select test_as('00000000-0000-0000-0000-0000000000c1');
select expect_count('I18 a removed teacher loses access at once',
       (select count(*) from students), 0);
select expect_count('I19 and their activity access too',
       (select count(*) from activity_events), 0);

-- --- a teacher cannot remove colleagues -------------------------------------
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_denied('I20 a teacher cannot remove a colleague', $sql$
  select remove_school_member('10000000-0000-0000-0000-00000000000a',
                              '00000000-0000-0000-0000-0000000000a2') $sql$);

reset role;
