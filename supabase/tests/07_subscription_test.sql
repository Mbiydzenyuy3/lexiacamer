-- ============================================================================
-- SUBSCRIPTION + REVENUE SHARE SUITE
--
-- The commercial claim being tested: a school earns only on months where a
-- pupil was BOTH enrolled and paid for. Enrolment alone earns nothing, which
-- is what makes registering fake pupils pointless.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000e1', 'payer@test');

-- Two pupils at School A for the same three months. One pays, one does not.
insert into students (id, display_name) values
  ('30000000-0000-0000-0000-0000000000f1', 'Paid Pupil'),
  ('30000000-0000-0000-0000-0000000000f2', 'Unpaid Pupil');

insert into guardianships (student_id, profile_id) values
  ('30000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000e1'),
  ('30000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000e1');

insert into enrolments (student_id, class_id, school_id, status, started_on, ended_on) values
  ('30000000-0000-0000-0000-0000000000f1','20000000-0000-0000-0000-0000000000a1',
   '10000000-0000-0000-0000-00000000000a','ended','2026-01-01','2026-03-31'),
  ('30000000-0000-0000-0000-0000000000f2','20000000-0000-0000-0000-0000000000a1',
   '10000000-0000-0000-0000-00000000000a','ended','2026-01-01','2026-03-31');

insert into subscriptions (id, student_id, payer_id, plan, current_period_end)
values ('70000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-0000000000f1',
        '00000000-0000-0000-0000-0000000000e1', 'monthly', '2026-02-28');

-- Paid for January and February only. March is enrolled but unpaid.
insert into payments (subscription_id, amount, provider, provider_ref,
                      status, period_start, period_end, paid_at)
values ('70000000-0000-0000-0000-000000000001', 1000, 'mtn_momo', 'REF-JAN',
        'succeeded', '2026-01-01','2026-01-31', '2026-01-01'),
       ('70000000-0000-0000-0000-000000000001', 1000, 'mtn_momo', 'REF-FEB',
        'succeeded', '2026-02-01','2026-02-28', '2026-02-01');

-- --- share counts paid months only ------------------------------------------
select expect_count('B01 January earns the school one student-month',
       (select student_months from school_student_months(
          '10000000-0000-0000-0000-00000000000a','2026-01-01','2026-03-31')
         where year_month = '2026-01-01'), 1);

select expect_count('B02 an enrolled but UNPAID month earns nothing',
       (select coalesce((select student_months from school_student_months(
          '10000000-0000-0000-0000-00000000000a','2026-03-01','2026-03-31')
         where year_month = '2026-03-01'), 0)), 0);

-- --- a failed payment is not a payment --------------------------------------
insert into payments (subscription_id, amount, provider, provider_ref,
                      status, period_start, period_end)
values ('70000000-0000-0000-0000-000000000001', 1000, 'mtn_momo', 'REF-MAR',
        'failed', '2026-03-01','2026-03-31');

select expect_count('B03 a failed payment earns nothing',
       (select coalesce((select student_months from school_student_months(
          '10000000-0000-0000-0000-00000000000a','2026-03-01','2026-03-31')
         where year_month = '2026-03-01'), 0)), 0);

-- --- webhook retries must not double-credit ---------------------------------
select expect_denied('B04 a replayed MoMo callback is refused', $sql$
  insert into payments (subscription_id, amount, provider, provider_ref,
                        status, period_start, period_end)
  values ('70000000-0000-0000-0000-000000000001', 1000, 'mtn_momo', 'REF-JAN',
          'succeeded', '2026-01-01','2026-01-31') $sql$);

select expect_count('B05 January still counts exactly once',
       (select student_months from school_student_months(
          '10000000-0000-0000-0000-00000000000a','2026-01-01','2026-01-31')
         where year_month = '2026-01-01'), 1);

-- --- a paying pupil at ANOTHER school earns this school nothing -------------
select expect_count('B06 School B earns nothing from School A''s pupil',
       (select count(*) from school_student_months(
          '10000000-0000-0000-0000-00000000000b','2026-01-01','2026-01-31')
         where student_months > 0), 0);

-- --- clients cannot write their own payments --------------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000e1');
select expect_denied('B07 a parent cannot forge a payment', $sql$
  insert into payments (subscription_id, amount, provider, provider_ref,
                        status, period_start, period_end)
  values ('70000000-0000-0000-0000-000000000001', 1, 'manual', 'FORGED',
          'succeeded', '2026-03-01','2026-03-31') $sql$);

select expect_denied('B08 a parent cannot create a subscription', $sql$
  insert into subscriptions (student_id, plan)
  values ('30000000-0000-0000-0000-0000000000f2', 'yearly') $sql$);

-- --- a parent CAN see their own child's billing -----------------------------
select expect_count('B09 a guardian sees their child''s subscription',
       (select count(*) from subscriptions
         where student_id = '30000000-0000-0000-0000-0000000000f1'), 1);
select expect_count('B10 a guardian sees their own payments',
       (select count(*) from payments), 3);

-- --- but a school must NOT see what a family pays ---------------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('B11 a school cannot see subscriptions',
       (select count(*) from subscriptions), 0);
select expect_count('B12 a school cannot see payments',
       (select count(*) from payments), 0);

-- --- and neither can a stranger ---------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_count('B13 a stranger sees no billing at all',
       (select count(*) from subscriptions), 0);

-- --- lapsing does not remove ACCESS -----------------------------------------
-- Money and access are separate: a child keeps playing, the school keeps the
-- history it had. Only the counting stops.
reset role;
update subscriptions set status = 'lapsed'
 where id = '70000000-0000-0000-0000-000000000001';

set role authenticated;
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('B14 a lapsed subscription does not revoke school access',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000f1'), 1);

set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000e1');
select expect_count('B15 a lapsed subscription does not revoke the parent',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000f1'), 1);

-- --- deleting an UNPAID child leaves no billable remnant --------------------
select delete_student('30000000-0000-0000-0000-0000000000f2');
reset role;
select expect_count('B16 deleting an unpaid pupil adds nothing to the ledger',
       (select coalesce(sum(student_months), 0) from billing_ledger
         where school_id = '10000000-0000-0000-0000-00000000000a'
           and year_month between '2026-01-01' and '2026-03-31'), 0);

-- --- deleting a PAID child preserves the figure already owed ----------------
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000e1');
select delete_student('30000000-0000-0000-0000-0000000000f1');
reset role;
select expect_count('B17 a paid pupil''s months survive deletion, anonymously',
       (select coalesce(sum(student_months), 0) from billing_ledger
         where school_id = '10000000-0000-0000-0000-00000000000a'
           and year_month between '2026-01-01' and '2026-02-28'), 2);

select expect_count('B18 the school''s total is unchanged by the deletion',
       (select coalesce(sum(student_months), 0)::bigint from school_student_months(
          '10000000-0000-0000-0000-00000000000a','2026-01-01','2026-02-28')), 2);

reset role;
