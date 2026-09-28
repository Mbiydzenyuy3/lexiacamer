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
