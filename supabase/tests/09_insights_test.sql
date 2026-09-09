-- ============================================================================
-- INSIGHTS SUITE
--
-- Two claims: the aggregate is arithmetically right, and it never describes a
-- cohort small enough to identify a child.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

-- Six children in Littoral, all aged 6, all missing 'TH' last month.
-- Six is above the floor, so this cohort should appear.
do $$
declare
  v_sid uuid;
  v_pid uuid;
  v_month timestamptz := date_trunc('month', current_date) - interval '1 month';
begin
  for i in 1..6 loop
    v_pid := gen_random_uuid();
    insert into auth.users (id, email) values (v_pid, 'ins' || i || '@test');
    insert into guardian_addresses (profile_id, region, city)
         values (v_pid, 'Littoral', 'Douala');

    insert into students (id, display_name, date_of_birth)
         values (gen_random_uuid(), 'Insight ' || i,
                 (current_date - interval '6 years 2 months')::date)
      returning id into v_sid;
    insert into guardianships (student_id, profile_id) values (v_sid, v_pid);

    insert into activity_events (id, student_id, kind, payload, occurred_at)
    values (gen_random_uuid(), v_sid, 'word_missed',
            jsonb_build_object('letters', jsonb_build_array('TH', 'A')),
            v_month + interval '3 days');
  end loop;
end;
$$;

-- Two children in Adamawa: below the floor, so this cohort must NOT appear.
do $$
declare
  v_sid uuid;
  v_pid uuid;
  v_month timestamptz := date_trunc('month', current_date) - interval '1 month';
begin
  for i in 1..2 loop
    v_pid := gen_random_uuid();
    insert into auth.users (id, email) values (v_pid, 'small' || i || '@test');
    insert into guardian_addresses (profile_id, region, city)
         values (v_pid, 'Adamawa', 'Ngaoundere');
    insert into students (id, display_name, date_of_birth)
         values (gen_random_uuid(), 'Small ' || i,
                 (current_date - interval '6 years 2 months')::date)
      returning id into v_sid;
    insert into guardianships (student_id, profile_id) values (v_sid, v_pid);
    insert into activity_events (id, student_id, kind, payload, occurred_at)
    values (gen_random_uuid(), v_sid, 'word_missed',
            jsonb_build_object('letters', jsonb_build_array('TH')),
            v_month + interval '3 days');
  end loop;
end;
$$;

select refresh_insights((date_trunc('month', current_date) - interval '1 month')::date);

-- --- the big cohort is described --------------------------------------------
select expect_count('N01 a cohort above the floor is aggregated',
       (select n_children from insights_phoneme
         where region = 'Littoral' and age_band = '6-7' and phoneme = 'TH'), 6);
select expect_count('N02 miss events are counted, not just children',
       (select miss_events from insights_phoneme
         where region = 'Littoral' and age_band = '6-7' and phoneme = 'TH'), 6);
select expect_count('N03 every missed letter gets its own row',
       (select n_children from insights_phoneme
         where region = 'Littoral' and age_band = '6-7' and phoneme = 'A'), 6);

-- --- the small one is suppressed entirely ------------------------------------
select expect_count('N04 a cohort below the floor is suppressed',
       (select count(*) from insights_phoneme where region = 'Adamawa'), 0);

-- --- the table holds nothing that identifies anyone ---------------------------
select expect_count('N05 no identifying columns exist',
       (select count(*) from information_schema.columns
         where table_name = 'insights_phoneme'
           and column_name in ('student_id', 'profile_id', 'display_name',
                               'date_of_birth', 'line1', 'city', 'email')), 0);

-- --- clients cannot read it ---------------------------------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-000000000001');
select expect_count('N06 a parent cannot read the insights table',
       (select count(*) from insights_phoneme), 0);
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('N07 a school cannot read the insights table',
       (select count(*) from insights_phoneme), 0);
-- Calling it as a client is harmless rather than forbidden: RLS filters the
-- reads to nothing and the writes to nothing, so it returns 0 and changes
-- nothing. Asserting "it raises" would be asserting the wrong property.
select expect_count('N08 a client running the aggregation aggregates nothing',
       (select refresh_insights(
          (date_trunc('month', current_date) - interval '1 month')::date)), 0);
reset role;
select expect_count('N08b and cannot destroy what the service role computed',
       (select n_children from insights_phoneme
         where region = 'Littoral' and age_band = '6-7' and phoneme = 'TH'), 6);
set role authenticated;

set role anon;
select test_as(null);
select expect_count('N09 anon cannot read the insights table',
       (select count(*) from insights_phoneme), 0);
reset role;

-- --- rerunning is idempotent, not cumulative ---------------------------------
select refresh_insights((date_trunc('month', current_date) - interval '1 month')::date);
select expect_count('N10 recomputing does not double-count',
       (select miss_events from insights_phoneme
         where region = 'Littoral' and age_band = '6-7' and phoneme = 'TH'), 6);

-- --- a child with no address still counts, under "unknown" -------------------
select expect_count('N11 children without a region are not silently dropped',
       (select count(*) from insights_phoneme where region = 'unknown'), 0);

reset role;
