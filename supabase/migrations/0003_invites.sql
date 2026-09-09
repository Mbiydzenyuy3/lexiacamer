-- ============================================================================
-- INVITES: the only route into a school's data.
--
-- Schools are created out of band, after a human verifies a real institution;
-- the first director is invited by the onboarding script (service role). From
-- there a director invites their own colleagues.
--
-- Because this is the sole path to a school's students, an invite is the most
-- sensitive object in the system. It is therefore: random, hashed at rest,
-- expiring, single-use, and BOUND TO ONE EMAIL: forwarding it must fail.
-- ============================================================================

-- Director-only. Returns the raw token exactly once.
create or replace function create_invite(p_school_id    uuid,
                                         p_email        text,
                                         p_role         text,
                                         p_class_id     uuid default null,
                                         p_expires_days int  default 14)
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

  if p_role not in ('director', 'teacher') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if coalesce(trim(p_email), '') = '' then
    raise exception 'email required' using errcode = '22023';
  end if;

  -- Only a live DIRECTOR of that school, and only while the school is active.
  -- A teacher must never be able to invite anyone: that would let them widen
  -- access to the school's students without the director's knowledge.
  if not exists (select 1 from school_members m
                   join schools s on s.id = m.school_id
                  where m.school_id  = p_school_id
                    and m.profile_id = v_uid
                    and m.role       = 'director'
                    and m.ended_on is null
                    and s.status     = 'active') then
    raise exception 'not a director of this school' using errcode = '42501';
  end if;

  -- A class invite must name a class belonging to THAT school. Without this a
  -- director could scope an invite onto another school's class.
  if p_class_id is not null
     and not exists (select 1 from classes c
                      where c.id = p_class_id
                        and c.school_id = p_school_id) then
    raise exception 'class does not belong to this school' using errcode = '42501';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into invites (token_hash, email, school_id, role, class_id,
                       expires_at, created_by)
  values (encode(digest(v_token, 'sha256'), 'hex'),
          lower(trim(p_email)),
          p_school_id,
          p_role,
          p_class_id,
          now() + make_interval(days => greatest(p_expires_days, 1)),
          v_uid);

  return v_token;
end;
$$;

-- Redeem an invite for YOURSELF. The caller's own email must match the address
-- the invite was issued to, so a forwarded link is useless to the recipient.
create or replace function redeem_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_inv   invites%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select lower(trim(email)) into v_email from profiles where id = v_uid;

  select * into v_inv
    from invites
   where token_hash  = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and redeemed_at is null
     and expires_at  > now();

  -- One message for every failure mode: an invalid, expired, used or
  -- wrong-recipient token must be indistinguishable to whoever is holding it.
  if not found or v_inv.email <> v_email then
    raise exception 'invalid or expired invite' using errcode = '42501';
  end if;

  if not exists (select 1 from schools s
                  where s.id = v_inv.school_id and s.status = 'active') then
    raise exception 'invalid or expired invite' using errcode = '42501';
  end if;

  insert into school_members (school_id, profile_id, role)
       values (v_inv.school_id, v_uid, v_inv.role)
  on conflict (school_id, profile_id)
    do update set role = excluded.role, ended_on = null;

  if v_inv.class_id is not null then
    insert into class_teachers (class_id, profile_id)
         values (v_inv.class_id, v_uid)
    on conflict (class_id, profile_id)
      do update set ended_on = null;
  end if;

  -- Single use.
  update invites set redeemed_at = now() where id = v_inv.id;

  return v_inv.school_id;
end;
$$;

-- A director managing outstanding invites. Never returns token_hash: the
-- invites table itself stays unreadable to clients.
create or replace function list_invites(p_school_id uuid)
returns table (id uuid, email text, role text, class_id uuid,
               expires_at timestamptz, redeemed_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.id, i.email, i.role, i.class_id, i.expires_at, i.redeemed_at
    from invites i
   where i.school_id = p_school_id
     and exists (select 1 from school_members m
                  where m.school_id  = p_school_id
                    and m.profile_id = (select auth.uid())
                    and m.role       = 'director'
                    and m.ended_on is null)
   order by i.created_at desc;
$$;

create or replace function revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_sid uuid;
begin
  select school_id into v_sid from invites where id = p_invite_id;
  if v_sid is null then
    raise exception 'no such invite' using errcode = '42501';
  end if;

  if not exists (select 1 from school_members m
                  where m.school_id  = v_sid
                    and m.profile_id = v_uid
                    and m.role       = 'director'
                    and m.ended_on is null) then
    raise exception 'not a director of this school' using errcode = '42501';
  end if;

  delete from invites where id = p_invite_id and redeemed_at is null;
end;
$$;

-- Remove a colleague's access. Ends the school membership, which immediately
-- closes every window they held (auth_student_windows requires a live
-- membership on both the director and teacher branches).
create or replace function remove_school_member(p_school_id uuid,
                                                p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if not exists (select 1 from school_members m
                  where m.school_id  = p_school_id
                    and m.profile_id = v_uid
                    and m.role       = 'director'
                    and m.ended_on is null) then
    raise exception 'not a director of this school' using errcode = '42501';
  end if;

  update school_members
     set ended_on = current_date
   where school_id = p_school_id
     and profile_id = p_profile_id
     and ended_on is null;
end;
$$;

revoke execute on function create_invite(uuid, text, text, uuid, int) from public;
revoke execute on function redeem_invite(text)                        from public;
revoke execute on function list_invites(uuid)                         from public;
revoke execute on function revoke_invite(uuid)                        from public;
revoke execute on function remove_school_member(uuid, uuid)           from public;

grant execute on function create_invite(uuid, text, text, uuid, int) to authenticated;
grant execute on function redeem_invite(text)                        to authenticated;
grant execute on function list_invites(uuid)                         to authenticated;
grant execute on function revoke_invite(uuid)                        to authenticated;
grant execute on function remove_school_member(uuid, uuid)           to authenticated;
