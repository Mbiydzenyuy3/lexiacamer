-- ============================================================================
-- RLS ATTACK SUITE
--
-- Every case here is an attack discussed while designing the schema. If any of
-- them regress, this file fails loudly. It is the gate for touching RLS.
--
-- Runs as the non-superuser role `authenticated`, because superusers bypass RLS
-- and would make every policy appear to pass.
-- ============================================================================

\set ON_ERROR_STOP on

create table test_results (
  label  text,
  passed boolean,
  detail text
);
grant select, insert on test_results to authenticated, anon;

create or replace function expect_count(p_label text, p_actual bigint, p_expected bigint)
returns void language plpgsql as $$
begin
  insert into test_results
  values (p_label, p_actual = p_expected,
          format('expected %s, got %s', p_expected, p_actual));
end;
$$;

-- Asserts an INSERT is REJECTED. A statement that succeeds is a leak.
create or replace function expect_denied(p_label text, p_sql text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    insert into test_results values (p_label, false, 'SUCCEEDED — LEAK');
  exception when others then
    insert into test_results values (p_label, true, 'rejected (' || sqlstate || ')');
  end;
end;
$$;

-- Asserts an UPDATE/DELETE CHANGES NOTHING.
-- Postgres does not raise on an UPDATE or DELETE with no matching policy — RLS
-- silently filters the rows out and the statement reports 0 rows. So "no error"
-- is NOT proof of safety here; the row count is.
create or replace function expect_no_write(p_label text, p_sql text)
returns void language plpgsql as $$
declare v_rows bigint;
begin
  begin
    execute p_sql;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      insert into test_results
      values (p_label, true, 'no rows written (RLS filtered)');
    else
      insert into test_results
      values (p_label, false, format('LEAK — %s row(s) written', v_rows));
    end if;
  exception when others then
    insert into test_results values (p_label, true, 'rejected (' || sqlstate || ')');
  end;
end;
$$;

-- ============================================================================
-- SEED  (as superuser: RLS bypassed, so this is setup, not a test)
-- ============================================================================

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'parent1@test'),
  ('00000000-0000-0000-0000-000000000002', 'parent2@test'),
  ('00000000-0000-0000-0000-00000000000a', 'director.a@test'),
  ('00000000-0000-0000-0000-0000000000a1', 'teacher.a1@test'),
  ('00000000-0000-0000-0000-0000000000a2', 'teacher.a2@test'),
  ('00000000-0000-0000-0000-0000000000ae', 'departed.a@test'),
  ('00000000-0000-0000-0000-00000000000b', 'director.b@test'),
  ('00000000-0000-0000-0000-0000000000ff', 'attacker@test');

-- profiles rows already exist: handle_new_user() created them above.
-- This only sets the signup routing hint.
insert into profiles (id, email, account_type) values
  ('00000000-0000-0000-0000-000000000001', 'parent1@test',   'parent'),
  ('00000000-0000-0000-0000-000000000002', 'parent2@test',   'parent'),
  ('00000000-0000-0000-0000-00000000000a', 'director.a@test','school'),
  ('00000000-0000-0000-0000-0000000000a1', 'teacher.a1@test','school'),
  ('00000000-0000-0000-0000-0000000000a2', 'teacher.a2@test','school'),
  ('00000000-0000-0000-0000-0000000000ae', 'departed.a@test','school'),
  ('00000000-0000-0000-0000-00000000000b', 'director.b@test','school'),
  -- the attacker signs up and picks "school" in the prompt
  ('00000000-0000-0000-0000-0000000000ff', 'attacker@test',  'school')
on conflict (id) do update set account_type = excluded.account_type;

insert into schools (id, name, status) values
  ('10000000-0000-0000-0000-00000000000a', 'School A', 'active'),
  ('10000000-0000-0000-0000-00000000000b', 'School B', 'active');

insert into school_members (school_id, profile_id, role, started_on, ended_on) values
  ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a','director','2026-01-01', null),
  ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a1','teacher', '2026-01-01', null),
  ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a2','teacher', '2026-01-01', null),
  -- departed: membership ended, but the class_teachers row below SURVIVES
  ('10000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000ae','teacher', '2026-01-01', '2026-06-30'),
  ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b','director','2026-01-01', null);

insert into classes (id, school_id, name) values
  ('20000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-00000000000a','Class A1'),
  ('20000000-0000-0000-0000-0000000000a2','10000000-0000-0000-0000-00000000000a','Class A2'),
  ('20000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-00000000000b','Class B1');

insert into class_teachers (class_id, profile_id, started_on, ended_on) values
  ('20000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a1','2026-01-01', null),
  ('20000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a2','2026-01-01', null),
  ('20000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000ae','2026-01-01', null);

insert into students (id, display_name) values
  ('30000000-0000-0000-0000-000000000001','Home Child'),
  ('30000000-0000-0000-0000-0000000000a1','Student A1'),
  ('30000000-0000-0000-0000-0000000000a2','Student A2'),
  ('30000000-0000-0000-0000-0000000000b1','Student B1'),
  ('30000000-0000-0000-0000-0000000000ee','Transfer Child');

insert into progress (student_id) values
  ('30000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-0000000000a1'),
  ('30000000-0000-0000-0000-0000000000ee');

insert into guardianships (student_id, profile_id) values
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');

insert into enrolments (student_id, class_id, school_id, started_on, ended_on) values
  ('30000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-00000000000a','2026-01-01', null),
  ('30000000-0000-0000-0000-0000000000a2','20000000-0000-0000-0000-0000000000a2','10000000-0000-0000-0000-00000000000a','2026-01-01', null),
  ('30000000-0000-0000-0000-0000000000b1','20000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-00000000000b','2026-01-01', null),
  -- the transfer: School A Jan-Mar, then School B from April
  ('30000000-0000-0000-0000-0000000000ee','20000000-0000-0000-0000-0000000000a1','10000000-0000-0000-0000-00000000000a','2026-01-01','2026-03-31'),
  ('30000000-0000-0000-0000-0000000000ee','20000000-0000-0000-0000-0000000000b1','10000000-0000-0000-0000-00000000000b','2026-04-01', null);

insert into activity_events (id, student_id, kind, occurred_at) values
  ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','word_completed','2026-05-01 10:00+00'),
  ('40000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000a1','word_completed','2026-05-01 10:00+00'),
  -- transfer child: one event at School A, one later at School B
  ('40000000-0000-0000-0000-0000000000e1','30000000-0000-0000-0000-0000000000ee','word_completed','2026-02-15 10:00+00'),
  ('40000000-0000-0000-0000-0000000000e2','30000000-0000-0000-0000-0000000000ee','word_completed','2026-05-15 10:00+00');

-- ============================================================================
-- FROM HERE ON: no superuser. RLS is live.
-- ============================================================================
set role authenticated;

-- --- 1. A signup with no grants sees nothing --------------------------------
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_count('01 attacker sees no students',
       (select count(*) from students), 0);
select expect_count('02 attacker sees no activity',
       (select count(*) from activity_events), 0);
select expect_count('03 attacker sees no progress',
       (select count(*) from progress), 0);
select expect_count('04 attacker sees no schools',
       (select count(*) from schools), 0);

-- --- 2. Grant tables reject direct writes (the original plan's hole) --------
select expect_denied('05 attacker cannot self-link as guardian', $sql$
  insert into guardianships (student_id, profile_id)
  values ('30000000-0000-0000-0000-0000000000a1',
          '00000000-0000-0000-0000-0000000000ff') $sql$);

select expect_denied('06 attacker cannot enrol a known student', $sql$
  insert into enrolments (student_id, class_id, school_id)
  values ('30000000-0000-0000-0000-0000000000a1',
          '20000000-0000-0000-0000-0000000000a1',
          '10000000-0000-0000-0000-00000000000a') $sql$);

select expect_denied('07 attacker cannot join a school', $sql$
  insert into school_members (school_id, profile_id, role)
  values ('10000000-0000-0000-0000-00000000000a',
          '00000000-0000-0000-0000-0000000000ff', 'director') $sql$);

select expect_denied('08 attacker cannot assign self to a class', $sql$
  insert into class_teachers (class_id, profile_id)
  values ('20000000-0000-0000-0000-0000000000a1',
          '00000000-0000-0000-0000-0000000000ff') $sql$);

select expect_denied('09 attacker cannot create a school', $sql$
  insert into schools (name) values ('Fake Institute') $sql$);

select expect_denied('10 attacker cannot enrol via RPC', $sql$
  select enrol_student('20000000-0000-0000-0000-0000000000a1', 'Mine') $sql$);

-- --- 3. account_type is a routing hint, not authorization -------------------
update profiles set account_type = 'school'
 where id = '00000000-0000-0000-0000-0000000000ff';
select expect_count('11 editing own account_type grants nothing',
       (select count(*) from students), 0);

-- --- 4. Teacher scope: own class only, own school only ----------------------
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('12 teacher A1 sees own-class students (A1 + transfer)',
       (select count(*) from students), 2);
select expect_count('13 teacher A1 cannot see class A2 student',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000a2'), 0);
select expect_count('14 teacher A1 cannot see School B student',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000b1'), 0);

-- --- 5. A departed teacher loses access despite a live class_teachers row ---
select test_as('00000000-0000-0000-0000-0000000000ae');
select expect_count('15 departed teacher sees no students',
       (select count(*) from students), 0);
select expect_count('16 departed teacher sees no activity',
       (select count(*) from activity_events), 0);

-- --- 6. Director scope: whole own school, nothing of another ----------------
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('17 director A sees all School A students',
       (select count(*) from students), 3);
select expect_count('18 director A cannot see School B student',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000b1'), 0);

-- --- 7. THE TRANSFER TEST: history kept, future invisible -------------------
select expect_count('19 director A sees transfer child''s School A event',
       (select count(*) from activity_events
         where student_id = '30000000-0000-0000-0000-0000000000ee'
           and id = '40000000-0000-0000-0000-0000000000e1'), 1);
select expect_count('20 director A CANNOT see event after transfer',
       (select count(*) from activity_events
         where id = '40000000-0000-0000-0000-0000000000e2'), 0);

select test_as('00000000-0000-0000-0000-00000000000b');
select expect_count('21 director B sees post-transfer event',
       (select count(*) from activity_events
         where id = '40000000-0000-0000-0000-0000000000e2'), 1);
select expect_count('22 director B CANNOT see pre-transfer event',
       (select count(*) from activity_events
         where id = '40000000-0000-0000-0000-0000000000e1'), 0);

-- --- 8. The progress cache side channel (lifetime totals) -------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('23 school cannot read the progress cache',
       (select count(*) from progress), 0);

-- --- 9. Parent scope -------------------------------------------------------
select test_as('00000000-0000-0000-0000-000000000001');
select expect_count('24 parent sees only their own child',
       (select count(*) from students), 1);
select expect_count('25 parent reads their child''s progress',
       (select count(*) from progress), 1);
select expect_count('26 parent sees own child''s full history',
       (select count(*) from activity_events), 1);

-- --- 10. create_student links caller and nobody else ------------------------
select test_as('00000000-0000-0000-0000-000000000002');
select create_student('Parent2 Child') as new_child \gset
select expect_count('27 parent2 sees the child they created',
       (select count(*) from students), 1);
select test_as('00000000-0000-0000-0000-000000000001');
select expect_count('28 parent1 cannot see parent2''s child',
       (select count(*) from students), 1);

-- --- 11. NOBODY may write a child's record. It is exactly what they did. ----
-- Adults are read-only everywhere. Only the child's device, through its
-- append-only device grant, can add to the record.
select test_as('00000000-0000-0000-0000-0000000000a1');   -- teacher
select expect_denied('29 teacher cannot invent activity', $sql$
  insert into activity_events (id, student_id, kind, occurred_at)
  values (gen_random_uuid(), '30000000-0000-0000-0000-0000000000a1',
          'word_completed', now()) $sql$);
select expect_no_write('30 teacher cannot edit progress', $sql$
  update progress set stars = 999
   where student_id = '30000000-0000-0000-0000-0000000000a1' $sql$);
select expect_no_write('31 teacher cannot delete history', $sql$
  delete from activity_events
   where student_id = '30000000-0000-0000-0000-0000000000a1' $sql$);

select test_as('00000000-0000-0000-0000-00000000000a');   -- director
select expect_denied('32 director cannot invent activity', $sql$
  insert into activity_events (id, student_id, kind, occurred_at)
  values (gen_random_uuid(), '30000000-0000-0000-0000-0000000000a1',
          'word_completed', now()) $sql$);

select test_as('00000000-0000-0000-0000-000000000001');   -- parent
select expect_denied('33 parent cannot invent activity', $sql$
  insert into activity_events (id, student_id, kind, occurred_at)
  values (gen_random_uuid(), '30000000-0000-0000-0000-000000000001',
          'word_completed', now()) $sql$);
select expect_no_write('34 parent cannot inflate their child''s stars', $sql$
  update progress set stars = 999
   where student_id = '30000000-0000-0000-0000-000000000001' $sql$);
select expect_no_write('35 parent cannot delete their child''s history', $sql$
  delete from activity_events
   where student_id = '30000000-0000-0000-0000-000000000001' $sql$);

-- Belt and braces: after every tampering attempt above, check as superuser
-- that the child's record is byte-for-byte what the child actually did.
reset role;
select expect_count('38 stars untouched after all tampering',
       (select stars from progress
         where student_id = '30000000-0000-0000-0000-000000000001'), 0);
select expect_count('39 no history was deleted',
       (select count(*) from activity_events), 4);
set role authenticated;

-- --- 12. Suspending a school cuts its members off ---------------------------
reset role;
update schools set status = 'suspended'
 where id = '10000000-0000-0000-0000-00000000000a';
set role authenticated;

select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('36 suspended school: director loses students',
       (select count(*) from students), 0);
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('37 suspended school: teacher loses students',
       (select count(*) from students), 0);

-- --- 13. Gaps found in the design audit -------------------------------------

-- A new user must end up with a profile row, or every FK to profiles fails
-- and the app is unusable on first sign-in.
reset role;
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000009', 'newuser@test');
select expect_count('40 profile is bootstrapped on signup',
       (select count(*) from profiles
         where id = '00000000-0000-0000-0000-000000000009'), 1);

-- The "I'm a school" form must be submittable with no account at all.
set role anon;
select test_as(null);
do $$
begin
  insert into school_access_requests (school_name, contact_email)
       values ('Real School', 'head@school.cm');
  insert into test_results values ('41 anon can submit a school request', true, 'accepted');
exception when others then
  insert into test_results values ('41 anon can submit a school request', false,
    'BLOCKED (' || sqlstate || ')');
end;
$$;
reset role;
set role authenticated;

-- ...but nobody can read the queue back out.
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_count('42 nobody can read the request queue',
       (select count(*) from school_access_requests), 0);

-- Unauthenticated callers see nothing at all.
select test_as(null);
select expect_count('43 anon sees no students',
       (select count(*) from students), 0);
select expect_count('44 anon sees no activity',
       (select count(*) from activity_events), 0);

-- A teacher must not reach the un-windowed lifetime cache either.
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('45 teacher cannot read the progress cache',
       (select count(*) from progress), 0);

-- School A must not learn where a departed student went.
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('46 school A cannot see the School B enrolment',
       (select count(*) from enrolments
         where school_id = '10000000-0000-0000-0000-00000000000b'), 0);

-- Clock skew: a device with a wrong date must not be able to post activity
-- into the future (and so into a window it was never granted).
reset role;
select expect_no_write('47 future-dated activity is rejected', $sql$
  insert into activity_events (id, student_id, kind, occurred_at)
  values (gen_random_uuid(), '30000000-0000-0000-0000-0000000000ee',
          'word_completed', '2099-01-01') $sql$);

-- ...including by forging recorded_at to match.
select expect_no_write('48 forged recorded_at cannot bypass the check', $sql$
  insert into activity_events (id, student_id, kind, occurred_at, recorded_at)
  values (gen_random_uuid(), '30000000-0000-0000-0000-0000000000ee',
          'word_completed', '2099-01-01', '2099-01-02') $sql$);

-- Duplicate open enrolment in the same class.
select expect_no_write('49 duplicate open enrolment is rejected', $sql$
  insert into enrolments (student_id, class_id, school_id)
  values ('30000000-0000-0000-0000-0000000000a1',
          '20000000-0000-0000-0000-0000000000a1',
          '10000000-0000-0000-0000-00000000000a') $sql$);

-- ============================================================================
-- SUMMARY
-- ============================================================================
reset role;

\echo ''
\echo '================ RLS ATTACK SUITE ================'
select case when passed then 'PASS' else '>>> FAIL' end as result,
       label, detail
  from test_results
 order by label;

do $$
declare v_failed int;
begin
  select count(*) into v_failed from test_results where not passed;
  if v_failed > 0 then
    raise exception '% RLS TEST(S) FAILED', v_failed;
  end if;
  raise notice 'ALL % RLS TESTS PASSED', (select count(*) from test_results);
end;
$$;
