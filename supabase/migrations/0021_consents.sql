-- ============================================================================
-- CONSENT BEFORE A CHILD'S DATA LEAVES THE PHONE
--
-- Cameroon Law 2024/017: consent must be express, specific to each purpose,
-- given before processing, and for an under-18 given by a parent IN ADDITION
-- to the child. Spec: docs/superpowers/specs/2026-09-29-parental-consent-design.md
--
-- Two purposes, recorded separately:
--   progress_sync  save the child's progress to the parent's account.
--                  Needs the parent's consent AND the child's own OK.
--   school_share   let the child's school see it. The parent's decision alone.
--
-- Rows are never deleted by the app. Withdrawal sets withdrawn_at. When a
-- child or an account is deleted the ids null out, and what is left proves a
-- consent existed and was withdrawn, with no child data in it.
-- ============================================================================

create table consents (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references profiles(id) on delete set null,
  student_id      uuid references students(id) on delete set null,
  purpose         text not null
                  check (purpose in ('progress_sync', 'school_share')),
  wording_version text not null
                  check (char_length(wording_version) between 1 and 20),
  child_assent_at timestamptz,
  granted_at      timestamptz not null default now(),
  withdrawn_at    timestamptz,
  check (purpose <> 'progress_sync' or child_assent_at is not null)
);

create unique index consents_one_live
  on consents (student_id, purpose)
  where withdrawn_at is null and student_id is not null;
create index consents_profile_idx on consents (profile_id);

alter table consents enable row level security;

-- Read your own. No insert, update or delete policy: rows change only through
-- the functions below. Supabase grants table writes to `authenticated` by
-- default, so RLS is the only thing that makes this read-only. Do not add one.
create policy consents_own_select on consents for select
  using (profile_id = (select auth.uid()));

create or replace function has_live_consent(p_student_id uuid, p_purpose text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from consents
                  where student_id = p_student_id
                    and purpose = p_purpose
                    and withdrawn_at is null);
$$;

-- ----------------------------------------------------------------------------
-- create_student: the child and its consent are created together or not at all.
--
-- The two-argument version must be dropped, not just replaced: otherwise a
-- two-argument call from an old cached app would still match it. With it gone,
-- that call resolves to this one with null consent, and is refused.
-- ----------------------------------------------------------------------------
drop function if exists create_student(text, text);

create or replace function create_student(p_name            text,
                                          p_avatar          text    default 'lion',
                                          p_consent_version text    default null,
                                          p_child_assent    boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if coalesce(trim(p_consent_version), '') = ''
     or not coalesce(p_child_assent, false) then
    raise exception 'consent required' using errcode = '42501';
  end if;

  insert into students (display_name, avatar)
       values (p_name, coalesce(p_avatar, 'lion'))
    returning id into v_id;

  insert into guardianships (student_id, profile_id, relationship)
       values (v_id, v_uid, 'parent');

  insert into progress (student_id) values (v_id);

  insert into consents (profile_id, student_id, purpose,
                        wording_version, child_assent_at)
       values (v_uid, v_id, 'progress_sync', trim(p_consent_version), now());

  return v_id;
end;
$$;

revoke execute on function has_live_consent(uuid, text) from public;
revoke execute on function create_student(text, text, text, boolean) from public;
grant  execute on function create_student(text, text, text, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- School sharing: the parent's separate, optional decision.
-- ----------------------------------------------------------------------------
create or replace function give_consent(p_student_id uuid,
                                        p_purpose    text,
                                        p_version    text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  -- `is distinct from`, not `<>`: a null purpose must be refused, and
  -- `null <> 'school_share'` is null, which an IF treats as false.
  if p_purpose is distinct from 'school_share' then
    raise exception 'only school_share is given here; progress_sync comes with create_student'
      using errcode = '22023';
  end if;

  if not exists (select 1 from guardianships g
                  where g.student_id = p_student_id
                    and g.profile_id = v_uid
                    and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  if has_live_consent(p_student_id, 'school_share') then
    return;                                   -- idempotent
  end if;

  insert into consents (profile_id, student_id, purpose, wording_version)
       values (v_uid, p_student_id, 'school_share', trim(p_version));
end;
$$;

-- Enforced on the rows, not in claim_school_place / note_school_interest.
-- The live database runs a newer claim_school_place (schools migration 0014)
-- than this branch defines; redefining it here would create a second,
-- conflicting overload. A trigger holds whichever version is live.
--
-- Only app requests are checked. PostgREST sets `role` to `authenticated` for a
-- signed-in user, and a security definer function does not change that
-- setting, so going through a function does not bypass this. Maintainer
-- scripts (service_role) and migrations are not app requests.
create or replace function require_school_share()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('role', true), 'none')
       not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Interest noted without naming a child carries no child data.
  if new.student_id is null then
    return new;
  end if;

  if not has_live_consent(new.student_id, 'school_share') then
    raise exception 'school sharing consent required' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger enrolments_require_school_share
  before insert on enrolments
  for each row execute function require_school_share();

create trigger directory_interest_require_school_share
  before insert on directory_interest
  for each row execute function require_school_share();

revoke execute on function give_consent(uuid, text, text) from public;
grant  execute on function give_consent(uuid, text, text) to authenticated;
