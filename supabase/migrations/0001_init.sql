-- ============================================================================
-- LexiaCamer — initial schema
--
-- Security model, in one sentence:
--   A student is a container; access is a set of independently revocable,
--   time-bounded GRANTS; activity is time-stamped. You can see a student's
--   activity only within the window your grant was active.
--
-- Two invariants hold the whole thing up:
--   1. No client may ever supply an existing student_id to any operation that
--      creates a grant. Grant tables therefore have NO insert policy at all —
--      RLS denies by default and every grant is minted by a SECURITY DEFINER
--      RPC that creates the student and the grant together, atomically.
--   2. The derived `progress` cache is un-windowed by definition (lifetime
--      totals), so it is readable by GUARDIANS ONLY. Schools compute their
--      numbers from activity_events inside their window.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- IDENTITY
-- ============================================================================

-- One row per authenticated adult. Deliberately has NO role column: role is a
-- property of a relationship, not of a person. `account_type` is a UI routing
-- hint only — nothing in this file reads it for authorization, and a user may
-- edit it freely without gaining anything.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  account_type text not null default 'parent'
               check (account_type in ('parent', 'school')),
  referred_by  text,                        -- e.g. 'educlynk' from ?ref
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- SCHOOLS
-- ============================================================================

-- A school only exists AFTER out-of-band verification of a real, operational
-- institution. There is no 'pending' state and no client path that creates one:
-- rows here are written by the service role only.
create table schools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  town              text,
  status            text not null default 'active'
                    check (status in ('active', 'suspended')),
  verified_by       text,                   -- who at LexiaCamer verified it
  verified_at       timestamptz,
  verification_note text,                   -- what evidence was checked
  created_at        timestamptz not null default now()
);

-- GRANT: adult -> school. Time-bounded so a departure revokes access.
create table school_members (
  school_id  uuid not null references schools(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role       text not null check (role in ('director', 'teacher')),
  started_on date not null default current_date,
  ended_on   date,                          -- null = still a member
  primary key (school_id, profile_id)
);
create index school_members_profile_idx on school_members (profile_id)
  where ended_on is null;

create table classes (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  name          text not null,
  academic_year text,
  created_at    timestamptz not null default now(),
  -- Enables the composite FK on enrolments below, which makes it structurally
  -- impossible for an enrolment to claim a school its class doesn't belong to.
  unique (id, school_id)
);

-- GRANT: teacher -> class. Time-bounded.
create table class_teachers (
  class_id   uuid not null references classes(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  started_on date not null default current_date,
  ended_on   date,
  primary key (class_id, profile_id)
);
create index class_teachers_profile_idx on class_teachers (profile_id)
  where ended_on is null;

-- ============================================================================
-- STUDENTS
-- ============================================================================

-- Owned by neither parent nor school. Access comes only from grants below.
create table students (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar       text not null default 'lion'
               check (avatar in ('lion', 'parrot', 'tortoise', 'dog')),
  created_at   timestamptz not null default now()
);

-- GRANT: parent/guardian -> student. Normally never ends.
create table guardianships (
  student_id   uuid not null references students(id) on delete cascade,
  profile_id   uuid not null references profiles(id) on delete cascade,
  relationship text not null default 'parent'
               check (relationship in ('parent', 'guardian')),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  primary key (student_id, profile_id)
);
create index guardianships_profile_idx on guardianships (profile_id);

-- GRANT: student -> class (and therefore school), for a dated period.
create table enrolments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id   uuid not null,
  school_id  uuid not null,
  started_on date not null default current_date,
  ended_on   date,                          -- null = currently enrolled
  foreign key (class_id, school_id)
    references classes(id, school_id) on delete cascade,
  check (ended_on is null or ended_on >= started_on)
);
create index enrolments_school_idx  on enrolments (school_id);
create index enrolments_class_idx   on enrolments (class_id);
create index enrolments_student_idx on enrolments (student_id);

-- A student cannot hold two open enrolments in the same class. (Overlapping
-- open enrolments in DIFFERENT schools are deliberately still allowed: a real
-- transfer often overlaps by a few weeks. Both schools then see the overlap
-- period, which is correct — each is legitimately teaching the child.)
create unique index enrolments_one_open_per_class
  on enrolments (student_id, class_id) where ended_on is null;

-- ============================================================================
-- ACTIVITY  (append-only; the source of truth)
-- ============================================================================

-- `id` is generated on the client so an offline device that syncs late INSERTS
-- rather than overwrites: retries are idempotent, two devices merge with no
-- conflict logic, and a child can never lose stars to a stale write.
create table activity_events (
  id              uuid primary key,
  student_id      uuid not null references students(id) on delete cascade,
  kind            text not null check (kind in (
                    'word_completed', 'phoneme_attempt',
                    'sticker_unlocked', 'session_started')),
  payload         jsonb not null default '{}',
  -- Client-supplied: when the child actually did it (may be days old if the
  -- device was offline). This is what school windows are matched against, so
  -- a device with a wrong clock could otherwise misattribute activity to a
  -- previous school. Two guards: recorded_at is forced server-side by the
  -- trigger below, and an event can never be dated in the future.
  occurred_at     timestamptz not null,
  recorded_at     timestamptz not null default now(),
  device_grant_id uuid,          -- provenance; FK added after device_grants
  constraint activity_not_future check (occurred_at <= recorded_at)
);

-- Ignore any client-supplied recorded_at. Without this the check constraint
-- above is bypassable by sending a future recorded_at alongside a future
-- occurred_at.
create or replace function force_recorded_at()
returns trigger language plpgsql as $$
begin
  new.recorded_at := now();
  return new;
end;
$$;

create trigger activity_events_recorded_at
  before insert on activity_events
  for each row execute function force_recorded_at();
create index activity_events_student_time_idx
  on activity_events (student_id, occurred_at);

-- Derived cache of lifetime totals. UN-WINDOWED BY DEFINITION, therefore
-- readable by guardians only (see policy below). Schools must never read this.
create table progress (
  student_id        uuid primary key references students(id) on delete cascade,
  words             int    not null default 0,
  streak            int    not null default 0,
  stars             int    not null default 0,
  unlocked_stickers text[] not null default '{}',
  missed_phonemes   jsonb  not null default '{}',
  updated_at        timestamptz not null default now()
);

-- ============================================================================
-- DEVICE GRANTS  (kid mode on a shared machine)
-- ============================================================================

-- Scoped to ONE student, append-only, reads nothing. Long-lived precisely
-- because it is powerless: a stolen tablet costs one child's star count.
create table device_grants (
  id         uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  student_id uuid not null references students(id) on delete cascade,
  issued_by  uuid not null references profiles(id) on delete cascade,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);
create index device_grants_student_idx on device_grants (student_id);

-- Deferred until device_grants exists: which device appended each event.
alter table activity_events
  add constraint activity_events_device_grant_fk
  foreign key (device_grant_id) references device_grants(id) on delete set null;

-- ============================================================================
-- INVITES  (the only route into a school's data)
-- ============================================================================

create table invites (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  email       text not null,                -- bound: forwarding it must fail
  school_id   uuid not null references schools(id) on delete cascade,
  role        text not null check (role in ('director', 'teacher')),
  class_id    uuid references classes(id) on delete cascade,
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Holds no student data and grants nothing. This is what the "I'm a school"
-- signup branch writes to; a human follows up out of band.
create table school_access_requests (
  school_name   text not null check (char_length(school_name)  between 1 and 200),
  contact_name  text          check (char_length(contact_name)  <= 120),
  contact_email text not null check (char_length(contact_email) between 3 and 200),
  contact_phone text          check (char_length(contact_phone) <= 40),
  town          text          check (char_length(town)          <= 120),
  note          text          check (char_length(note)          <= 2000),
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'approved', 'declined')),
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- THE ACCESS FUNCTION
--
-- Returns every (student, window) pair the caller may see. This is the entire
-- cross-tenant security guarantee: one function to test, audit and reason about.
-- SECURITY DEFINER also avoids the RLS-recursion errors that break most
-- multi-tenant Supabase setups, and (select auth.uid()) is evaluated once as an
-- InitPlan rather than once per row.
-- ============================================================================

-- Schools the caller is a live member of. SECURITY DEFINER is load-bearing:
-- a policy on school_members that queries school_members recurses infinitely.
-- Every school-context policy below routes through this instead.
create or replace function auth_school_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.school_id
    from school_members m
    join schools s on s.id = m.school_id
   where m.profile_id = (select auth.uid())
     and m.ended_on is null
     and s.status = 'active';
$$;

-- Classes inside those schools.
create or replace function auth_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id
    from classes c
   where c.school_id in (select auth_school_ids());
$$;

create or replace function auth_student_windows()
returns table (student_id uuid, from_ts timestamptz, to_ts timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- Guardian: the whole history, always — including activity from before the
  -- link was made. A co-parent added later, or a guardian linked through a
  -- future consent flow, must still see the child's complete record. Only the
  -- END of the window is meaningful for a guardian.
  select g.student_id,
         '-infinity'::timestamptz,
         coalesce(g.ended_at, 'infinity'::timestamptz)
    from guardianships g
   where g.profile_id = (select auth.uid())

  union all

  -- Director: every enrolment window in a school they ACTIVELY direct.
  -- Requires a live membership, so a departure revokes access immediately.
  select e.student_id,
         e.started_on::timestamptz,
         coalesce((e.ended_on + 1)::timestamptz, 'infinity'::timestamptz)
    from enrolments e
    join school_members m on m.school_id = e.school_id
    join schools s        on s.id = e.school_id
   where m.profile_id = (select auth.uid())
     and m.role = 'director'
     and m.ended_on is null
     and s.status = 'active'

  union all

  -- Teacher: the INTERSECTION of the enrolment and their time on the class,
  -- and only while they remain a member of that school.
  -- least() ignores nulls, so an open end on either side leaves it open.
  select e.student_id,
         greatest(e.started_on, ct.started_on)::timestamptz,
         coalesce((least(e.ended_on, ct.ended_on) + 1)::timestamptz,
                  'infinity'::timestamptz)
    from enrolments e
    join class_teachers ct on ct.class_id = e.class_id
    join school_members m  on m.school_id = e.school_id
                          and m.profile_id = ct.profile_id
    join schools s         on s.id = e.school_id
   where ct.profile_id = (select auth.uid())
     and ct.ended_on is null
     and m.ended_on is null
     and s.status = 'active';
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Every table on. Note what is ABSENT: there is no insert/update/delete policy
-- on any grant table (guardianships, enrolments, school_members, class_teachers)
-- or on schools. RLS denies by default, so those writes are impossible from a
-- client and can only happen through the RPCs below or the service role.
-- ============================================================================

alter table profiles               enable row level security;
alter table schools                enable row level security;
alter table school_members         enable row level security;
alter table classes                enable row level security;
alter table class_teachers         enable row level security;
alter table students               enable row level security;
alter table guardianships          enable row level security;
alter table enrolments             enable row level security;
alter table activity_events        enable row level security;
alter table progress               enable row level security;
alter table device_grants          enable row level security;
alter table invites                enable row level security;
alter table school_access_requests enable row level security;

-- --- profiles: your own row only -------------------------------------------
-- Deliberately NO insert policy: the row is created by the trigger below when
-- the auth user is created, so it always exists by the time the client asks.
create policy profiles_select on profiles for select
  using (id = (select auth.uid()));
create policy profiles_update on profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- --- the school request form: write-only public mailbox ---------------------
-- The "I'm a school" signup branch must be submittable by someone with no
-- account at all. It grants nothing and holds no student data. There is no
-- select policy, so nobody can read the queue back out — including the person
-- who submitted. Rate limiting belongs at the edge, not here.
create policy school_requests_insert on school_access_requests
  for insert to anon, authenticated with check (true);

-- --- students: visible if you hold any window over them ---------------------
create policy students_select on students for select
  using (exists (select 1 from auth_student_windows() w
                  where w.student_id = students.id));

-- --- activity: THE policy. Windowed by grant. ------------------------------
create policy activity_select on activity_events for select
  using (exists (select 1 from auth_student_windows() w
                  where w.student_id = activity_events.student_id
                    and activity_events.occurred_at >= w.from_ts
                    and activity_events.occurred_at <  w.to_ts));

-- --- progress: GUARDIANS ONLY (un-windowed lifetime totals) ----------------
create policy progress_select on progress for select
  using (exists (select 1 from guardianships g
                  where g.student_id = progress.student_id
                    and g.profile_id = (select auth.uid())
                    and g.ended_at is null));

-- --- school context: readable only by live members --------------------------
-- All of these route through the SECURITY DEFINER helpers. Writing them as
-- direct subqueries against school_members causes infinite policy recursion.
create policy schools_select on schools for select
  using (id in (select auth_school_ids()));

create policy school_members_select on school_members for select
  using (school_id in (select auth_school_ids()));

create policy classes_select on classes for select
  using (school_id in (select auth_school_ids()));

create policy class_teachers_select on class_teachers for select
  using (class_id in (select auth_class_ids()));

create policy enrolments_select on enrolments for select
  using (school_id in (select auth_school_ids())
         or exists (select 1 from guardianships g
                     where g.student_id = enrolments.student_id
                       and g.profile_id = (select auth.uid())
                       and g.ended_at is null));

-- --- guardianships: see only your own links --------------------------------
create policy guardianships_select on guardianships for select
  using (profile_id = (select auth.uid()));

-- device_grants, invites and school_access_requests get NO policies at all:
-- they are service-role / RPC territory. Clients can neither read nor write.

-- ============================================================================
-- RPCs — the only client-facing way a grant is ever created.
-- Each one CREATES the student it links to. None accepts an existing
-- student_id, so knowing a UUID buys an attacker nothing.
-- ============================================================================

create or replace function create_student(p_name text, p_avatar text default 'lion')
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

  insert into students (display_name, avatar)
       values (p_name, coalesce(p_avatar, 'lion'))
    returning id into v_id;

  insert into guardianships (student_id, profile_id, relationship)
       values (v_id, v_uid, 'parent');

  insert into progress (student_id) values (v_id);

  return v_id;
end;
$$;

-- Directors only. Creates a NEW student and enrols them; there is deliberately
-- no parameter by which a caller could name a student that already exists.
create or replace function enrol_student(p_class_id uuid,
                                         p_name     text,
                                         p_avatar   text default 'lion')
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_school_id uuid;
  v_id        uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select c.school_id into v_school_id
    from classes c
    join school_members m on m.school_id = c.school_id
    join schools s        on s.id = c.school_id
   where c.id = p_class_id
     and m.profile_id = v_uid
     and m.role = 'director'
     and m.ended_on is null
     and s.status = 'active';

  if v_school_id is null then
    raise exception 'not a director of this class''s school'
      using errcode = '42501';
  end if;

  insert into students (display_name, avatar)
       values (p_name, coalesce(p_avatar, 'lion'))
    returning id into v_id;

  insert into enrolments (student_id, class_id, school_id)
       values (v_id, p_class_id, v_school_id);

  insert into progress (student_id) values (v_id);

  return v_id;
end;
$$;

-- ============================================================================
-- PROFILE BOOTSTRAP
--
-- Without this, a brand-new user signs in, has no profiles row, and cannot
-- create one (there is no insert policy) — every foreign key to profiles then
-- fails and the app is unusable on first sign-in.
-- ============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into profiles (id, email)
       values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;      -- idempotent: safe if the user is recreated
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

revoke all on function auth_student_windows() from public;
grant execute on function auth_student_windows() to public;
