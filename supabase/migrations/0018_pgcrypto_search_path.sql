-- ============================================================================
-- pgcrypto IS NOT IN public
--
-- Supabase installs extensions into an `extensions` schema. Every function
-- here declares `set search_path = public, pg_temp`, which is right for
-- safety and wrong about where gen_random_bytes and digest actually live. So
-- on a real project:
--
--   create_invite        -> function gen_random_bytes(integer) does not exist
--   redeem_invite        -> same, on digest
--   issue_device_grant   -> same
--   sync_activity        -> same
--
-- That is invites and device tokens, which is to say school onboarding and
-- every offline sync. All of it broken, while 294 local tests passed, because
-- `create extension pgcrypto` installs into public locally and the search_path
-- happened to be right by accident.
--
-- The fix is to name the schema. A missing schema in search_path is ignored
-- rather than an error, so `public, extensions, pg_temp` is correct both here
-- and locally. The test shim now installs pgcrypto the way Supabase does, so
-- this class of bug fails the suite instead of reaching a director's screen.
-- ============================================================================

alter function issue_device_grant(uuid, int)
  set search_path = public, extensions, pg_temp;

alter function sync_activity(text, jsonb)
  set search_path = public, extensions, pg_temp;

alter function create_invite(uuid, text, text, uuid, int)
  set search_path = public, extensions, pg_temp;

alter function redeem_invite(text)
  set search_path = public, extensions, pg_temp;

-- Everything else that is SECURITY DEFINER keeps the narrower public-only
-- path: none of them call an extension, and a wider search_path on a definer
-- function is surface that should only be opened where it is needed.
