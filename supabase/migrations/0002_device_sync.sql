-- ============================================================================
-- DEVICE GRANTS + SYNC — the only write path into a child's record.
--
-- Kid mode has no user session: the child never signs in. The device instead
-- holds a random token scoped to ONE student that can only APPEND activity and
-- can read nothing at all. That is why it may safely live for months on an
-- unattended classroom machine — stealing it buys you the ability to add stars
-- to one child.
--
-- Implemented as SECURITY DEFINER RPCs rather than an Edge Function so the
-- write path is covered by the same test suite as everything else. An Edge
-- Function would sit outside RLS *and* outside the tests.
-- ============================================================================

-- Mint a device token for a student the caller currently has access to.
-- Returns the RAW token exactly once; only its hash is stored, so a database
-- leak does not yield working device tokens.
create or replace function issue_device_grant(p_student_id   uuid,
                                              p_expires_days int default 180)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_token text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Must hold a CURRENTLY-OPEN window on this student. A school that only has
  -- a historical window (the child left) cannot mint a new device token.
  if not exists (select 1 from auth_student_windows() w
                  where w.student_id = p_student_id
                    and w.to_ts > now()) then
    raise exception 'no current access to this student' using errcode = '42501';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into device_grants (token_hash, student_id, issued_by, expires_at)
  values (encode(digest(v_token, 'sha256'), 'hex'),
          p_student_id,
          v_uid,
          now() + make_interval(days => greatest(p_expires_days, 1)));

  return v_token;
end;
$$;

-- A parent needs to see which devices can write for their child in order to
-- revoke one. The table itself stays unreadable (RLS, no policies) so the
-- token hashes never leave the database; this returns only what a "manage
-- devices" screen needs.
create or replace function list_device_grants(p_student_id uuid)
returns table (id uuid, issued_at timestamptz,
               expires_at timestamptz, revoked_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select d.id, d.issued_at, d.expires_at, d.revoked_at
    from device_grants d
   where d.student_id = p_student_id
     and exists (select 1 from auth_student_windows() w
                  where w.student_id = p_student_id
                    and w.to_ts > now())
   order by d.issued_at desc;
$$;

create or replace function revoke_device_grant(p_grant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_sid uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select student_id into v_sid from device_grants where id = p_grant_id;
  if v_sid is null then
    raise exception 'no such device grant' using errcode = '42501';
  end if;

  if not exists (select 1 from auth_student_windows() w
                  where w.student_id = v_sid and w.to_ts > now()) then
    raise exception 'no current access to this student' using errcode = '42501';
  end if;

  update device_grants set revoked_at = now()
   where id = p_grant_id and revoked_at is null;
end;
$$;

-- ============================================================================
-- SYNC — append activity from an offline device.
--
-- Callable by `anon`: kid mode has no session. The token IS the credential.
-- ============================================================================

create or replace function sync_activity(p_token text, p_events jsonb)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_grant device_grants%rowtype;
  v_count int := 0;
begin
  if p_token is null or length(p_token) < 32 then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  select * into v_grant
    from device_grants
   where token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and revoked_at is null
     and (expires_at is null or expires_at > now());

  if not found then
    raise exception 'invalid device token' using errcode = '42501';
  end if;

  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'events must be an array' using errcode = '22023';
  end if;

  if jsonb_array_length(p_events) > 500 then
    raise exception 'too many events in one batch' using errcode = '22023';
  end if;

  insert into activity_events
      (id, student_id, kind, payload, occurred_at, device_grant_id)
  select (e->>'id')::uuid,
         -- NEVER from the client. A device token can only ever write for the
         -- one student it was minted for, whatever the payload claims.
         v_grant.student_id,
         e->>'kind',
         coalesce(e->'payload', '{}'::jsonb),
         (e->>'occurred_at')::timestamptz,
         v_grant.id
    from jsonb_array_elements(p_events) e
   -- An event cannot predate the grant, so a device cannot back-date activity
   -- into a period belonging to a school the child has already left. Small
   -- tolerance for clock skew on the device.
   where (e->>'occurred_at')::timestamptz >= v_grant.issued_at - interval '5 minutes'
     and (e->>'occurred_at')::timestamptz <= now()
  -- Client-generated ids make retries idempotent: a device that syncs the same
  -- batch twice cannot double-count a child's stars.
  on conflict (id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Kid mode is unauthenticated, so anon must be able to call sync. It can do
-- nothing without a valid token, and a token grants append-only access to one
-- student's activity.
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and `anon` is
-- a member of PUBLIC — so revoking from `anon` alone would leave it able to
-- call these anyway. The grant has to be removed from PUBLIC and re-issued.
revoke execute on function issue_device_grant(uuid, int) from public;
revoke execute on function revoke_device_grant(uuid)     from public;
grant  execute on function issue_device_grant(uuid, int) to authenticated;
grant  execute on function revoke_device_grant(uuid)     to authenticated;
grant  execute on function sync_activity(text, jsonb)    to anon, authenticated;
revoke execute on function list_device_grants(uuid) from public;
grant  execute on function list_device_grants(uuid) to authenticated;
