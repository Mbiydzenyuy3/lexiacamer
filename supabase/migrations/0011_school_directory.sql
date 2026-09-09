-- ============================================================================
-- SCHOOL DIRECTORY
--
-- Two different things were being conflated by one table:
--
--   schools           a VERIFIED TENANT. Has a director, a dashboard, pupils
--                     it can see, and a revenue share. Created by hand after a
--                     human checked the institution is real.
--
--   school_directory  a NAME ON A MAP. Reference data, mostly imported from
--                     OpenStreetMap. Grants nothing to anybody, has no
--                     director, and cannot see a single child.
--
-- A parent whose school is not on the platform can now find it and say "that
-- one", which is the common case for word-of-mouth signups. That records their
-- interest; it does NOT create an enrolment, because there is nobody on the
-- other side to receive it. When the school later signs up for real, its
-- directory entry is pointed at the verified row and the waiting parents can
-- be enrolled properly.
--
-- Keeping these separate is what stops "findable" from quietly meaning
-- "trusted". Everything in the tenancy model still flows from `schools`.
-- ============================================================================

create table school_directory (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 200),
  town              text check (char_length(town) <= 120),
  region            text check (char_length(region) <= 120),
  source            text not null default 'osm'
                    check (source in ('osm', 'manual', 'parent')),
  external_ref      text,          -- e.g. the OSM element id, for re-imports
  lat               double precision,
  lon               double precision,
  -- Set once the institution joins for real. Non-null means "this name on the
  -- map is now that tenant".
  verified_school_id uuid references schools(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (source, external_ref)
);

create index school_directory_name_idx on school_directory (lower(name));
create index school_directory_town_idx on school_directory (lower(town));

alter table school_directory enable row level security;

-- Readable by anyone signed in: it is a public list of place names, with no
-- personal data and no access attached. Writes are service-role only.
create policy school_directory_select on school_directory
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- A parent saying "my child goes to that one".
--
-- Records interest against a directory entry. Deliberately NOT an enrolment:
-- there is no verified school, so there is nobody who could be granted a
-- window and nobody entitled to a share.
-- ----------------------------------------------------------------------------
create table directory_interest (
  directory_id uuid not null references school_directory(id) on delete cascade,
  profile_id   uuid not null references profiles(id) on delete cascade,
  student_id   uuid references students(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (directory_id, profile_id)
);

alter table directory_interest enable row level security;

create policy directory_interest_own on directory_interest
  for select using (profile_id = (select auth.uid()));

-- No insert policy: it goes through the RPC below, which checks the caller
-- actually guardians the child they are naming.
-- ----------------------------------------------------------------------------

create or replace function note_school_interest(p_directory_id uuid,
                                                p_student_id   uuid default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_student_id is not null
     and not exists (select 1 from guardianships g
                      where g.student_id = p_student_id
                        and g.profile_id = (select auth.uid())
                        and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  insert into directory_interest (directory_id, profile_id, student_id)
       values (p_directory_id, (select auth.uid()), p_student_id)
  on conflict (directory_id, profile_id)
    do update set student_id = excluded.student_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- One search across both, with platform schools first.
--
-- `on_platform` is what the UI branches on: a platform result leads to a class
-- list and a real enrolment, a directory result leads to "we will let you know
-- when they join". The distinction is returned by the database rather than
-- inferred in the client, so the two can never be confused.
-- ----------------------------------------------------------------------------
create or replace function search_schools_all(p_query text)
returns table (id uuid, name text, town text,
               on_platform boolean, directory_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with q as (select coalesce(trim(p_query), '') as term)
  -- Verified tenants first: if a school is really on the platform, that is
  -- always the result a parent wants.
  select s.id, s.name, s.town, true, d.id
    from schools s
    left join school_directory d on d.verified_school_id = s.id
   cross join q
   where s.status = 'active'
     and (q.term = '' or s.name ilike '%' || q.term || '%')

  union all

  -- Then names on the map that have not joined yet.
  select null::uuid, d.name,
         coalesce(d.town, d.region), false, d.id
    from school_directory d
   cross join q
   where d.verified_school_id is null
     and q.term <> ''
     and (d.name ilike '%' || q.term || '%')

   order by 4 desc, 2
   limit 25;
$$;

revoke execute on function search_schools_all(text)          from public;
revoke execute on function note_school_interest(uuid, uuid)  from public;
grant  execute on function search_schools_all(text)          to authenticated;
grant  execute on function note_school_interest(uuid, uuid)  to authenticated;

-- Who is waiting on a school that has not joined. The other half of the sales
-- list: these parents already have children using the app.
create or replace function directory_demand()
returns table (directory_id uuid, name text, town text, families bigint)
language sql
stable
as $$
  select d.id, d.name, d.town, count(distinct i.profile_id)
    from school_directory d
    join directory_interest i on i.directory_id = d.id
   where d.verified_school_id is null
   group by d.id, d.name, d.town
   order by count(distinct i.profile_id) desc, d.name;
$$;

revoke execute on function directory_demand() from public;
