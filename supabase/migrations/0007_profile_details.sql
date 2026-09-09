-- ============================================================================
-- PROFILE DETAILS: what a parent tells us at onboarding.
--
-- Split deliberately by WHO MAY SEE IT, not by what it describes:
--
--   students          child's name, birth date, gender. A school with a live
--                     window already reads this table, so anything added here
--                     is visible to that child's teachers. That is intended.
--
--   profiles          parent's name and phone. Schools cannot read profiles at
--                     all, so these reach a teacher only through the narrow
--                     student_contacts() projection below.
--
--   guardian_addresses  home address. Its OWN TABLE, guardian-only, with no
--                     school-facing policy anywhere. A column on profiles
--                     would be one policy mistake away from a school reading
--                     it; a separate table is structurally unreachable.
--
-- A child's home address alongside their name, age, school and daily activity
-- times is the most sensitive combination in this product. It gets the
-- strongest available separation, not a column comment asking people to be
-- careful.
-- ============================================================================

alter table students
  add column date_of_birth date,
  add column gender text
      check (gender in ('female', 'male', 'other', 'unspecified'));

-- Birth date rather than age, because age is a fact that goes stale and a
-- birth date is one that does not. The app derives the age.
alter table students
  add constraint students_dob_sane
  check (date_of_birth is null
         or (date_of_birth > current_date - interval '25 years'
             and date_of_birth <= current_date));

alter table profiles
  add column full_name text check (char_length(full_name) <= 120),
  add column phone     text check (char_length(phone) <= 32);

-- ----------------------------------------------------------------------------
-- HOME ADDRESS: guardian-only, always.
-- ----------------------------------------------------------------------------
create table guardian_addresses (
  profile_id   uuid primary key references profiles(id) on delete cascade,
  line1        text check (char_length(line1)        <= 200),
  neighbourhood text check (char_length(neighbourhood) <= 120),
  city         text check (char_length(city)         <= 120),
  region       text check (char_length(region)       <= 120),
  note         text check (char_length(note)         <= 500),
  updated_at   timestamptz not null default now()
);

alter table guardian_addresses enable row level security;

-- Only ever your own row. There is deliberately no school-facing policy, no
-- projection function, and nothing that joins this to a student.
create policy own_address_select on guardian_addresses for select
  using (profile_id = (select auth.uid()));
create policy own_address_insert on guardian_addresses for insert
  with check (profile_id = (select auth.uid()));
create policy own_address_update on guardian_addresses for update
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- Let a parent record their own details and their own child's.
-- ----------------------------------------------------------------------------
create or replace function update_my_profile(p_full_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  update profiles
     set full_name = nullif(trim(p_full_name), ''),
         phone     = nullif(trim(p_phone), '')
   where id = (select auth.uid());
end;
$$;

create or replace function update_student_details(p_student_id uuid,
                                                  p_name       text,
                                                  p_dob        date,
                                                  p_gender     text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from guardianships g
                  where g.student_id = p_student_id
                    and g.profile_id = (select auth.uid())
                    and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  update students
     set display_name  = coalesce(nullif(trim(p_name), ''), display_name),
         date_of_birth = p_dob,
         gender        = coalesce(p_gender, 'unspecified')
   where id = p_student_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- The ONLY route from a school to a parent's contact details.
--
-- Returns name and phone for the guardians of one student, and only to someone
-- holding a CURRENT window on that child. A departed teacher, or a school the
-- child has left, gets nothing: a stale roster must not remain a contact list.
-- Address is not returned here and has no equivalent function.
-- ----------------------------------------------------------------------------
create or replace function student_contacts(p_student_id uuid)
returns table (guardian_name text, guardian_phone text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.full_name, p.phone
    from guardianships g
    join profiles p on p.id = g.profile_id
   where g.student_id = p_student_id
     and g.ended_at is null
     and exists (select 1 from auth_student_windows() w
                  where w.student_id = p_student_id
                    and w.to_ts > now());
$$;

revoke execute on function student_contacts(uuid)                from public;
revoke execute on function update_my_profile(text, text)         from public;
revoke execute on function update_student_details(uuid, text, date, text) from public;
grant  execute on function student_contacts(uuid)                to authenticated;
grant  execute on function update_my_profile(text, text)         to authenticated;
grant  execute on function update_student_details(uuid, text, date, text) to authenticated;
