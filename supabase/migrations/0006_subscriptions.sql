-- ============================================================================
-- SUBSCRIPTIONS, PAYMENTS AND REVENUE SHARE
--
-- Deliberate separation: ACCESS is governed by grants, MONEY is governed by
-- these tables, and the two never touch. A lapsed subscription therefore
-- changes no RLS policy: a child keeps playing offline and their school keeps
-- the history it already had; what stops is the student counting toward that
-- school's share. Gating features on payment is a product decision for the
-- front end, not a security boundary.
--
-- Subscriptions are per STUDENT, not per parent, because revenue share is
-- calculated per student at a school. A family plan can be layered on later by
-- having one payment settle several students' periods.
-- ============================================================================

create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references students(id) on delete cascade,
  payer_id           uuid references profiles(id) on delete set null,
  plan               text not null check (plan in ('monthly', 'yearly')),
  status             text not null default 'active'
                     check (status in ('active', 'lapsed', 'cancelled')),
  current_period_end date,
  created_at         timestamptz not null default now()
);
create unique index subscriptions_one_active_per_student
  on subscriptions (student_id) where status = 'active';
create index subscriptions_payer_idx on subscriptions (payer_id);

-- Each payment BUYS A PERIOD. Keeping the period on the payment (rather than
-- only on the subscription) is what makes historical share reconstructible:
-- to know whether March was paid for, you look at payments, not at today's
-- subscription state.
create table payments (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount          int  not null check (amount > 0),   -- XAF has no subunit
  currency        text not null default 'XAF',
  provider        text not null
                  check (provider in ('mtn_momo', 'orange_money', 'manual')),
  provider_ref    text,
  status          text not null default 'pending'
                  check (status in ('pending', 'succeeded', 'failed')),
  period_start    date not null,
  period_end      date not null,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  check (period_end >= period_start),
  -- Mobile Money webhooks retry. Without this, a repeated callback would
  -- credit the same payment twice and inflate a school's share.
  unique (provider, provider_ref)
);
create index payments_subscription_idx on payments (subscription_id);
create index payments_period_idx on payments (period_start, period_end)
  where status = 'succeeded';

alter table subscriptions enable row level security;
alter table payments      enable row level security;

-- A guardian sees their own child's subscription. Schools deliberately do NOT:
-- a school has no business knowing what a family pays, only how many of its
-- pupils are paid up, which it gets as a count.
create policy subscriptions_select on subscriptions for select
  using (exists (select 1 from guardianships g
                  where g.student_id = subscriptions.student_id
                    and g.profile_id = (select auth.uid())
                    and g.ended_at is null));

create policy payments_select on payments for select
  using (exists (select 1 from subscriptions s
                  join guardianships g on g.student_id = s.student_id
                 where s.id = payments.subscription_id
                   and g.profile_id = (select auth.uid())
                   and g.ended_at is null));

-- No insert/update policies anywhere: payments are written by the Mobile Money
-- webhook using the service role. A client that could write its own payment
-- rows could grant itself a subscription and inflate a school's share.

-- ----------------------------------------------------------------------------
-- Which months a student actually paid for.
-- ----------------------------------------------------------------------------
create or replace function student_paid_months(p_student_id uuid)
returns table (year_month date)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct date_trunc('month', m)::date
    from subscriptions s
    join payments p on p.subscription_id = s.id
    cross join lateral generate_series(
           date_trunc('month', p.period_start),
           date_trunc('month', p.period_end),
           interval '1 month') m
   where s.student_id = p_student_id
     and p.status = 'succeeded';
$$;

-- ----------------------------------------------------------------------------
-- REVENUE SHARE: student-months per school.
--
-- A month counts only when BOTH are true: the student was enrolled at that
-- school, and someone actually paid for that month. Enrolment alone earns
-- nothing, which is what makes registering fake pupils pointless.
--
-- Adds billing_ledger, which carries the anonymised remnants of children whose
-- parents deleted them, so a deletion cannot erase a figure you already paid.
-- ----------------------------------------------------------------------------
create or replace function school_student_months(p_school_id uuid,
                                                 p_from      date,
                                                 p_to        date)
returns table (year_month date, student_months bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with live as (
    select date_trunc('month', m)::date as ym, e.student_id
      from enrolments e
      cross join lateral generate_series(
             date_trunc('month', greatest(e.started_on, p_from)),
             date_trunc('month', least(coalesce(e.ended_on, p_to), p_to)),
             interval '1 month') m
     where e.school_id = p_school_id
       and e.status in ('active', 'ended')
       and exists (select 1 from student_paid_months(e.student_id) pm
                    where pm.year_month = date_trunc('month', m)::date)
  ),
  counted as (
    select ym, count(distinct student_id) as n from live group by ym
  )
  select coalesce(c.ym, b.year_month) as year_month,
         coalesce(c.n, 0) + coalesce(b.student_months, 0) as student_months
    from counted c
    full outer join billing_ledger b
      on b.year_month = c.ym and b.school_id = p_school_id
   where coalesce(c.ym, b.year_month) between p_from and p_to
   order by 1;
$$;

-- ----------------------------------------------------------------------------
-- Correction to 0005: the deletion stub counted ENROLLED months. A school only
-- earns on months that were PAID, so an unpaid child being deleted must not
-- leave a billable remnant behind.
-- ----------------------------------------------------------------------------
create or replace function record_billing_for_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into billing_ledger (school_id, year_month, student_months)
  select e.school_id, m::date, 1
    from enrolments e
    cross join lateral generate_series(
           date_trunc('month', e.started_on),
           date_trunc('month', coalesce(e.ended_on, current_date)),
           interval '1 month') m
   where e.student_id = p_student_id
     and e.status in ('active', 'ended')
     and exists (select 1 from student_paid_months(p_student_id) pm
                  where pm.year_month = m::date)
  on conflict (school_id, year_month) do update
     set student_months = billing_ledger.student_months + 1;
end;
$$;

revoke execute on function school_student_months(uuid, date, date) from public;
revoke execute on function student_paid_months(uuid)               from public;
grant  execute on function student_paid_months(uuid)               to authenticated;
