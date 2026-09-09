-- ============================================================================
-- LOCAL TEST SHIM: not part of the Supabase migration.
--
-- Supabase provides `auth.users` and `auth.uid()`. This recreates just enough
-- of them to run 0001_init.sql and the RLS suite against a throwaway Postgres,
-- so the security properties can be PROVEN before touching a real project.
--
-- Run order:  00_local_shim.sql -> ../migrations/0001_init.sql
--             -> 01_grants.sql -> 02_rls_test.sql
-- ============================================================================

create extension if not exists pgcrypto;

create schema if not exists auth;

create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text
);

-- Supabase reads the subject claim off the verified JWT. Locally we set it
-- with set_config(), which is exactly how PostgREST does it.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- The role PostgREST uses for a signed-in user. Crucially NOT a superuser:
-- superusers bypass RLS entirely, so running the suite as `postgres` would
-- make every policy look like it passes.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end
$$;

-- Impersonate a user for the duration of the session.
create or replace function test_as(p_uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), false);
end;
$$;
