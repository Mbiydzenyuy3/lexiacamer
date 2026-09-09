-- ============================================================================
-- DATA LIFECYCLE — export and deletion.
--
-- Deletion is the ONE operation allowed to break the append-only guarantee, so
-- it is a single narrow audited path rather than a delete policy. A general
-- delete policy would quietly undo "nobody can alter a child's record".
--
-- Policy (chosen deliberately): the PARENT WINS. Deleting a child erases
-- everything, including the historical window a school was told it could keep.
-- What survives is an anonymous COUNT — "one student-month at School A in
-- March" — with no name, no events, and no link to any person. That is enough
-- to defend a revenue-share figure if a school disputes it, and not enough to
-- identify anyone.
-- ============================================================================

-- Deliberately has no student_id and no profile_id: there is nothing here to
-- re-identify. Rows are counts per school per month, collapsed together.
create table billing_ledger (
  school_id      uuid not null references schools(id) on delete cascade,
  year_month     date not null,
  student_months int  not null default 0,
  recorded_at    timestamptz not null default now(),
  primary key (school_id, year_month)
);

alter table billing_ledger enable row level security;
-- No policies: this is yours, read via the service role when you settle up.

-- ----------------------------------------------------------------------------
-- EXPORT — everything held about one child, for their guardian.
-- ----------------------------------------------------------------------------
create or replace function export_student(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_out jsonb;
begin
  if not exists (select 1 from guardianships g
                  where g.student_id = p_student_id
                    and g.profile_id = v_uid
                    and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'child', (select jsonb_build_object('name', s.display_name,
                                        'avatar', s.avatar,
                                        'created_at', s.created_at)
                from students s where s.id = p_student_id),
    'progress', (select to_jsonb(p) - 'student_id'
                   from progress p where p.student_id = p_student_id),
    'schools', coalesce((
       select jsonb_agg(jsonb_build_object(
                'school', sc.name, 'class', c.name,
                'from', e.started_on, 'to', e.ended_on, 'status', e.status)
              order by e.started_on)
         from enrolments e
         join classes c on c.id = e.class_id
         join schools sc on sc.id = e.school_id
        where e.student_id = p_student_id), '[]'::jsonb),
    'activity', coalesce((
       select jsonb_agg(jsonb_build_object(
                'kind', a.kind, 'payload', a.payload, 'at', a.occurred_at)
              order by a.occurred_at)
         from activity_events a
        where a.student_id = p_student_id), '[]'::jsonb)
  ) into v_out;

  return v_out;
end;
$$;

-- ----------------------------------------------------------------------------
-- The anonymising step, shared by explicit deletion and orphan cleanup.
-- ----------------------------------------------------------------------------
create or replace function record_billing_for_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Cancelled enrolments are excluded: that relationship never existed, so it
  -- never earned anyone a share.
  insert into billing_ledger (school_id, year_month, student_months)
  select e.school_id, m::date, 1
    from enrolments e
    cross join lateral generate_series(
           date_trunc('month', e.started_on),
           date_trunc('month', coalesce(e.ended_on, current_date)),
           interval '1 month') m
   where e.student_id = p_student_id
     and e.status in ('active', 'ended')
  on conflict (school_id, year_month) do update
     set student_months = billing_ledger.student_months + 1;
end;
$$;

-- ----------------------------------------------------------------------------
-- DELETE — guardian-initiated, irreversible.
-- ----------------------------------------------------------------------------
create or replace function delete_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if not exists (select 1 from guardianships g
                  where g.student_id = p_student_id
                    and g.profile_id = v_uid
                    and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  perform record_billing_for_student(p_student_id);

  -- Cascades to guardianships, enrolments, activity_events, progress and
  -- device_grants. The school's window disappears with the enrolment rows.
  delete from students where id = p_student_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- ORPHAN CLEANUP
--
-- students has no FK to profiles, so deleting a parent account cascaded away
-- their guardianships and left the child's record unreachable forever: nobody
-- could see it and nobody could delete it. A student with no guardian is
-- garbage, so it is anonymised and removed on the same terms.
-- ----------------------------------------------------------------------------
create or replace function cleanup_orphaned_student()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- The student row may already be gone (this fires from its own cascade).
  if not exists (select 1 from students where id = old.student_id) then
    return null;
  end if;

  if not exists (select 1 from guardianships
                  where student_id = old.student_id) then
    perform record_billing_for_student(old.student_id);
    delete from students where id = old.student_id;
  end if;

  return null;
end;
$$;

create trigger guardianships_cleanup_orphans
  after delete on guardianships
  for each row execute function cleanup_orphaned_student();

revoke execute on function record_billing_for_student(uuid) from public;
revoke execute on function export_student(uuid)             from public;
revoke execute on function delete_student(uuid)             from public;
grant  execute on function export_student(uuid)             to authenticated;
grant  execute on function delete_student(uuid)             to authenticated;
