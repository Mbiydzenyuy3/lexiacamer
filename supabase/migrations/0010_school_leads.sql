-- ============================================================================
-- SCHOOL LEADS
--
-- A parent whose school is not on the platform must not be stuck, and must not
-- be able to invent a school either. Inventing one would put an unverified row
-- into the tenancy model, which is the exact thing manual verification exists
-- to prevent: a "school" with no director, no dashboard and nobody entitled to
-- a share.
--
-- So an unlisted school is captured as a LEAD, not an enrolment. It grants
-- nothing to anybody, links to no student, and creates no window. What it does
-- is tell you where the demand is: "31 parents typed Government School
-- Bamenda" is a ranked list of schools to go and pitch, which is worth more
-- than a directory import that would be stale on arrival.
-- ============================================================================

create table school_leads (
  id           uuid primary key default gen_random_uuid(),
  raw_name     text not null check (char_length(raw_name) between 2 and 200),
  town         text check (char_length(town) <= 120),
  submitted_by uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- One lead per parent per school name, so the count is parents rather than
-- taps. lower() so casing does not split a school into several leads.
create unique index school_leads_one_per_parent
  on school_leads (submitted_by, lower(raw_name))
  where submitted_by is not null;

create index school_leads_name_idx on school_leads (lower(raw_name));

alter table school_leads enable row level security;

-- Write-only for parents: they can name their school, and cannot read the
-- list back. Nobody browses other people's submissions.
create policy school_leads_insert on school_leads for insert to authenticated
  with check (submitted_by = (select auth.uid()));

-- No select policy. You read it with the service role when deciding where to
-- go next.

create or replace function suggest_school(p_name text, p_town text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' then
    return;
  end if;

  insert into school_leads (raw_name, town, submitted_by)
       values (trim(p_name), nullif(trim(p_town), ''), (select auth.uid()))
  on conflict do nothing;
end;
$$;

-- Where the demand is. Service role only: this is a sales list, not app data.
create or replace function school_demand()
returns table (raw_name text, town text, parents bigint, first_seen timestamptz)
language sql
stable
as $$
  select min(l.raw_name), min(l.town),
         count(distinct l.submitted_by), min(l.created_at)
    from school_leads l
   group by lower(l.raw_name)
   order by count(distinct l.submitted_by) desc, min(l.created_at);
$$;

revoke execute on function suggest_school(text, text) from public;
grant  execute on function suggest_school(text, text) to authenticated;
revoke execute on function school_demand()           from public;
