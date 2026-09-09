-- ============================================================================
-- INSIGHTS: the aggregate layer.
--
-- This is where the commercial and research value of the platform lives:
-- which sounds Cameroonian children actually struggle with, by age and region.
-- Nobody has that data. It is publishable, it strengthens a school pitch, and
-- no competitor can reproduce it without the users.
--
-- The individual records are NOT the asset. They are operational data with a
-- serious downside and almost no value to anyone but the child's own parent
-- and teacher. So this layer is derived, never joined back, and holds:
--
--   * no student_id, no profile_id, no name, no birth date, no address
--   * only counts, per month, per region, per age band, per phoneme
--   * nothing at all for a cohort too small to be anonymous
--
-- That last rule is what makes the difference. "Region + age band + phoneme"
-- with three children in it identifies a child. With a floor on cohort size it
-- identifies a population. The floor is enforced in the aggregation, not left
-- to whoever writes the query.
--
-- Region comes from guardian_addresses, which is exactly what the onboarding
-- screen tells parents it is for: understanding which parts of Cameroon we
-- serve. If that ever stops being true, the screen has to change too.
-- ============================================================================

create table insights_phoneme (
  period_month date not null,
  region       text not null default 'unknown',
  age_band     text not null,
  phoneme      text not null,
  n_children   int  not null,
  miss_events  int  not null,
  computed_at  timestamptz not null default now(),
  primary key (period_month, region, age_band, phoneme)
);

alter table insights_phoneme enable row level security;
-- No policies at all. Read it with the service role when you publish or
-- report. Making it client-readable is a deliberate decision to take later,
-- not a default to inherit.

-- The smallest cohort we will ever describe. Below this, a row stops being a
-- statistic and starts being a person.
create or replace function insights_min_cohort()
returns int language sql immutable as $$ select 5 $$;

create or replace function refresh_insights(
  p_month date default date_trunc('month', current_date)::date)
returns int
language plpgsql
-- SECURITY INVOKER, deliberately. Every other function here is DEFINER so it
-- can do one safe thing on a caller's behalf; this one must do the opposite.
-- As INVOKER it runs with the caller's own rights, so writing to
-- insights_phoneme (RLS on, no policies) fails for anon and authenticated and
-- succeeds only for the service role, which bypasses RLS.
--
-- That matters because revoking EXECUTE is not durable on its own: a later
-- blanket "grant execute on all functions" would hand it back to every signed
-- in user. This way the grant is irrelevant, since the write still fails. It
-- is the same shape of mistake as the PUBLIC grant found on the device-grant
-- functions, closed structurally instead of by remembering.
set search_path = public, pg_temp
as $$
declare
  v_rows int;
begin
  delete from insights_phoneme where period_month = p_month;

  insert into insights_phoneme
      (period_month, region, age_band, phoneme, n_children, miss_events)
  select p_month,
         coalesce(addr.region, 'unknown'),
         case
           when s.date_of_birth is null then 'unknown'
           when age(p_month, s.date_of_birth) < interval '6 years'  then '4-5'
           when age(p_month, s.date_of_birth) < interval '8 years'  then '6-7'
           else '8+'
         end,
         l.value,
         count(distinct e.student_id),
         count(*)
    from activity_events e
    join students s on s.id = e.student_id
    -- At most one region per child. Joining guardianships directly would
    -- multiply the counts for a child with two parents.
    left join lateral (
      select ga.region
        from guardianships g
        join guardian_addresses ga on ga.profile_id = g.profile_id
       where g.student_id = s.id
         and g.ended_at is null
         and ga.region is not null
       limit 1
    ) addr on true
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(e.payload->'letters') = 'array'
           then e.payload->'letters' else '[]'::jsonb end) l
   where e.kind = 'word_missed'
     and date_trunc('month', e.occurred_at)::date = p_month
   group by 1, 2, 3, 4
  having count(distinct e.student_id) >= insights_min_cohort();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke execute on function refresh_insights(date) from public;
revoke execute on function insights_min_cohort() from public;
