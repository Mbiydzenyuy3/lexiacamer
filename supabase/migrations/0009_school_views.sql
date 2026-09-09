-- ============================================================================
-- SCHOOL-SIDE READS
--
-- A teacher or director needs a roster with progress on it. They cannot use
-- the `progress` cache: that holds LIFETIME totals, un-windowed by definition,
-- so exposing it would leak what a child earned at a school they have since
-- moved to. Everything here is therefore computed from activity_events
-- INSIDE the caller's own window, every time.
--
-- That is more work per query than reading a cached row, and it is the price
-- of the isolation guarantee. Where it gets slow, the fix is a per-enrolment
-- windowed aggregate, not opening up the cache.
-- ============================================================================

-- Which schools the caller belongs to, and as what. Drives the routing after
-- sign-in: a parent gets no rows, a teacher gets their school, a director gets
-- theirs. Nobody is asked to declare which they are.
create or replace function my_schools()
returns table (school_id uuid, name text, town text, role text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id, s.name, s.town, m.role
    from school_members m
    join schools s on s.id = m.school_id
   where m.profile_id = (select auth.uid())
     and m.ended_on is null
     and s.status = 'active'
   order by s.name;
$$;

-- The classes this person actually works with. A teacher gets the classes they
-- teach, NOT every class in the school; a director gets all of them. This is
-- the difference the whole teacher/director distinction rests on, so it is
-- computed here rather than filtered in the UI.
create or replace function my_classes()
returns table (class_id uuid, class_name text, school_id uuid,
               school_name text, academic_year text, student_count bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id, c.name, s.id, s.name, c.academic_year,
         (select count(*) from enrolments e
           where e.class_id = c.id and e.status = 'active')
    from classes c
    join schools s on s.id = c.school_id
    join school_members m on m.school_id = c.school_id
                         and m.profile_id = (select auth.uid())
                         and m.ended_on is null
   where s.status = 'active'
     and (m.role = 'director'
          or exists (select 1 from class_teachers ct
                      where ct.class_id = c.id
                        and ct.profile_id = (select auth.uid())
                        and ct.ended_on is null))
   order by s.name, c.name;
$$;

-- One class's roster with progress, windowed.
--
-- Only students the caller currently holds a window on appear, and only
-- activity from inside that window is counted. A child who transferred in last
-- month shows the work they did here, not the work they did before.
create or replace function class_roster(p_class_id uuid)
returns table (student_id     uuid,
               display_name   text,
               age_years      int,
               words          bigint,
               misses         bigint,
               top_missed     text,
               last_active    timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with allowed as (
    -- The caller must have a relationship to THIS CLASS, not merely to some
    -- child who happens to be in it. Without this, a teacher could name
    -- another school's class and get back any pupil they knew from elsewhere,
    -- revealing where that child also studies.
    select 1 from my_classes() mc where mc.class_id = p_class_id
  ),
  visible as (
    select e.student_id, w.from_ts, w.to_ts
      from enrolments e
      join auth_student_windows() w on w.student_id = e.student_id
     where e.class_id = p_class_id
       and e.status in ('active', 'ended')
       and exists (select 1 from allowed)
  ),
  events as (
    select v.student_id, a.kind, a.payload, a.occurred_at
      from visible v
      join activity_events a on a.student_id = v.student_id
                            and a.occurred_at >= v.from_ts
                            and a.occurred_at <  v.to_ts
  )
  select s.id,
         s.display_name,
         case when s.date_of_birth is null then null
              else extract(year from age(current_date, s.date_of_birth))::int
         end,
         count(*) filter (where ev.kind = 'word_completed'),
         count(*) filter (where ev.kind = 'word_missed'),
         (select l.value
            from events e2
            cross join lateral jsonb_array_elements_text(
              case when jsonb_typeof(e2.payload->'letters') = 'array'
                   then e2.payload->'letters' else '[]'::jsonb end) l
           where e2.student_id = s.id
           group by l.value
           order by count(*) desc, l.value
           limit 1),
         max(ev.occurred_at)
    from (select distinct student_id from visible) vs
    join students s on s.id = vs.student_id
    left join events ev on ev.student_id = s.id
   group by s.id, s.display_name, s.date_of_birth
   order by s.display_name;
$$;

revoke execute on function my_schools()        from public;
revoke execute on function my_classes()        from public;
revoke execute on function class_roster(uuid)  from public;
grant  execute on function my_schools()        to authenticated;
grant  execute on function my_classes()        to authenticated;
grant  execute on function class_roster(uuid)  to authenticated;
