-- ============================================================================
-- DATA LIFECYCLE SUITE: export and deletion.
--
-- Policy under test: the parent wins. Deletion erases everything, including
-- the school's historical window. What survives is an anonymous count.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

-- A child with a real history: enrolled at School A, then School B, with
-- activity in both periods.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000d1', 'deleteparent@test');

insert into students (id, display_name)
values ('30000000-0000-0000-0000-0000000000dd', 'Delete Me');

insert into guardianships (student_id, profile_id)
values ('30000000-0000-0000-0000-0000000000dd',
        '00000000-0000-0000-0000-0000000000d1');

insert into progress (student_id) values ('30000000-0000-0000-0000-0000000000dd');

insert into enrolments (student_id, class_id, school_id, status, started_on, ended_on)
values ('30000000-0000-0000-0000-0000000000dd',
        '20000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-00000000000a', 'ended', '2026-01-01','2026-02-28'),
       ('30000000-0000-0000-0000-0000000000dd',
        '20000000-0000-0000-0000-0000000000b1',
        '10000000-0000-0000-0000-00000000000b', 'active', '2026-03-01', null),
       -- a cancelled claim: must NEVER earn a school a share
       ('30000000-0000-0000-0000-0000000000dd',
        '20000000-0000-0000-0000-0000000000a2',
        '10000000-0000-0000-0000-00000000000a', 'cancelled','2026-01-05','2026-01-06');

insert into activity_events (id, student_id, kind, occurred_at)
values ('60000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-0000000000dd','word_completed','2026-01-15 09:00+00'),
       ('60000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-0000000000dd','word_completed','2026-03-15 09:00+00');

-- --- EXPORT -----------------------------------------------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000d1');

select expect_count('L01 export returns the child''s activity',
       (select jsonb_array_length(
          export_student('30000000-0000-0000-0000-0000000000dd')->'activity')), 2);
select expect_count('L02 export lists every school period',
       (select jsonb_array_length(
          export_student('30000000-0000-0000-0000-0000000000dd')->'schools')), 3);
select expect_count('L03 export includes the child''s name',
       (select count(*) from jsonb_each_text(
          export_student('30000000-0000-0000-0000-0000000000dd')->'child')
         where value = 'Delete Me'), 1);

select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_denied('L04 a stranger cannot export a child', $sql$
  select export_student('30000000-0000-0000-0000-0000000000dd') $sql$);

-- The school can read the child while enrolled, but cannot export them.
select test_as('00000000-0000-0000-0000-00000000000b');
select expect_denied('L05 a school cannot export a pupil', $sql$
  select export_student('30000000-0000-0000-0000-0000000000dd') $sql$);

-- --- DELETE -----------------------------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_denied('L06 a stranger cannot delete a child', $sql$
  select delete_student('30000000-0000-0000-0000-0000000000dd') $sql$);

select test_as('00000000-0000-0000-0000-0000000000d1');
select delete_student('30000000-0000-0000-0000-0000000000dd');

reset role;
select expect_count('L07 the student record is gone',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000dd'), 0);
select expect_count('L08 every activity event is gone',
       (select count(*) from activity_events
         where student_id = '30000000-0000-0000-0000-0000000000dd'), 0);
select expect_count('L09 progress is gone',
       (select count(*) from progress
         where student_id = '30000000-0000-0000-0000-0000000000dd'), 0);
select expect_count('L10 enrolments are gone',
       (select count(*) from enrolments
         where student_id = '30000000-0000-0000-0000-0000000000dd'), 0);
select expect_count('L11 guardianships are gone',
       (select count(*) from guardianships
         where student_id = '30000000-0000-0000-0000-0000000000dd'), 0);

-- The parent wins: the school loses the historical window it was keeping.
set role authenticated;
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('L12 the old school retains nothing',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000dd'), 0);

-- --- what survives is an anonymous count ------------------------------------
reset role;
-- This child never paid, and a school earns only on PAID months, so deleting
-- them leaves no billable remnant at all. (07_subscription_test covers the
-- paid case, where the months DO survive anonymously.)
select expect_count('L13 deleting an unpaid child leaves no remnant',
       (select coalesce(sum(student_months), 0) from billing_ledger
         where school_id = '10000000-0000-0000-0000-00000000000a'), 0);
select expect_count('L14 no ledger row is created for an unpaid child',
       (select count(*) from billing_ledger
         where school_id = '10000000-0000-0000-0000-00000000000a'), 0);
select expect_count('L15 the ledger cannot identify anyone',
       (select count(*) from information_schema.columns
         where table_name = 'billing_ledger'
           and column_name in ('student_id', 'profile_id', 'name')), 0);

-- --- ORPHAN CLEANUP ---------------------------------------------------------
-- Deleting a parent account used to leave the child unreachable forever:
-- visible to nobody, deletable by nobody.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000d2', 'orphanparent@test');

insert into students (id, display_name)
values ('30000000-0000-0000-0000-0000000000d0', 'Orphan Test');
insert into guardianships (student_id, profile_id)
values ('30000000-0000-0000-0000-0000000000d0',
        '00000000-0000-0000-0000-0000000000d2');

select expect_count('L16 the child exists while the parent does',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000d0'), 1);

delete from auth.users where id = '00000000-0000-0000-0000-0000000000d2';

select expect_count('L17 deleting the last guardian removes the child',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000d0'), 0);

-- A child with a second guardian must SURVIVE one parent leaving.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000d3', 'coparent1@test'),
       ('00000000-0000-0000-0000-0000000000d4', 'coparent2@test');
insert into students (id, display_name)
values ('30000000-0000-0000-0000-0000000000d5', 'Two Parents');
insert into guardianships (student_id, profile_id) values
  ('30000000-0000-0000-0000-0000000000d5','00000000-0000-0000-0000-0000000000d3'),
  ('30000000-0000-0000-0000-0000000000d5','00000000-0000-0000-0000-0000000000d4');

delete from auth.users where id = '00000000-0000-0000-0000-0000000000d3';

select expect_count('L18 a co-parent leaving does not delete the child',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000d5'), 1);
select expect_count('L19 the remaining guardian keeps their link',
       (select count(*) from guardianships
         where student_id = '30000000-0000-0000-0000-0000000000d5'), 1);

reset role;
