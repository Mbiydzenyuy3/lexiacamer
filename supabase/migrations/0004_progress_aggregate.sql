-- ============================================================================
-- DERIVED PROGRESS
--
-- activity_events is the source of truth; `progress` is a cache. Nothing was
-- maintaining it, so every dashboard would have read zeros.
--
-- Scoring lives HERE rather than being sent by the device. The client reports
-- only what the child DID ("completed a word", "missed these letters"); the
-- database decides what that is worth. A tampered device can therefore claim
-- more activity, but cannot mint arbitrary stars, and the rules have one home.
-- Rules mirror src/App.jsx: +5 stars per word, +20 per completed round,
-- streak resets on a miss.
-- ============================================================================

alter table activity_events drop constraint activity_events_kind_check;
alter table activity_events add constraint activity_events_kind_check
  check (kind in ('word_completed', 'word_missed', 'round_completed',
                  'phoneme_attempt', 'sticker_unlocked', 'session_started'));

-- The sticker catalogue, so star costs are not hard-coded in two places.
create table stickers (
  id       text primary key,
  cost     int  not null check (cost > 0),
  sort_key int  not null default 0
);

insert into stickers (id, cost, sort_key) values
  ('lion_cub',     15, 1),
  ('grey_parrot',  25, 2),
  ('tortoise',     40, 3),
  ('dog',          50, 4),
  ('baobab',       75, 5),
  ('mt_cameroon', 100, 6);

alter table stickers enable row level security;
create policy stickers_select on stickers for select to anon, authenticated
  using (true);   -- a public price list; contains no personal data

-- ----------------------------------------------------------------------------
-- Recompute one student's cache from their events.
-- ----------------------------------------------------------------------------
create or replace function recompute_progress(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_words    int;
  v_rounds   int;
  v_spent    int;
  v_streak   int;
  v_stickers text[];
  v_missed   jsonb;
begin
  select count(*) filter (where kind = 'word_completed'),
         count(*) filter (where kind = 'round_completed')
    into v_words, v_rounds
    from activity_events
   where student_id = p_student_id;

  select coalesce(array_agg(distinct payload->>'sticker_id'), '{}')
    into v_stickers
    from activity_events
   where student_id = p_student_id
     and kind = 'sticker_unlocked'
     and payload ? 'sticker_id';

  select coalesce(sum(s.cost), 0) into v_spent
    from stickers s
   where s.id = any(v_stickers);

  -- Consecutive correct words since the most recent miss.
  select count(*) into v_streak
    from activity_events
   where student_id = p_student_id
     and kind = 'word_completed'
     and occurred_at > coalesce(
           (select max(occurred_at) from activity_events
             where student_id = p_student_id and kind = 'word_missed'),
           '-infinity'::timestamptz);

  -- Which letters this child trips over, counted across every missed word.
  select coalesce(jsonb_object_agg(letter, n), '{}'::jsonb)
    into v_missed
    from (select l.value as letter, count(*) as n
            from activity_events e
            cross join lateral jsonb_array_elements_text(
                   case when jsonb_typeof(e.payload->'letters') = 'array'
                        then e.payload->'letters' else '[]'::jsonb end) l
           where e.student_id = p_student_id
             and e.kind = 'word_missed'
           group by l.value) x;

  insert into progress (student_id, words, streak, stars,
                        unlocked_stickers, missed_phonemes, updated_at)
  values (p_student_id,
          v_words,
          v_streak,
          greatest(v_words * 5 + v_rounds * 20 - v_spent, 0),
          v_stickers,
          v_missed,
          now())
  on conflict (student_id) do update
     set words             = excluded.words,
         streak            = excluded.streak,
         stars             = excluded.stars,
         unlocked_stickers = excluded.unlocked_stickers,
         missed_phonemes   = excluded.missed_phonemes,
         updated_at        = excluded.updated_at;
end;
$$;

-- ----------------------------------------------------------------------------
-- Statement-level trigger, so a 500-event sync batch recomputes each affected
-- student ONCE rather than 500 times.
-- ----------------------------------------------------------------------------
create or replace function refresh_progress_for_batch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  for r in select distinct student_id from new_rows loop
    perform recompute_progress(r.student_id);
  end loop;
  return null;
end;
$$;

create trigger activity_events_refresh_progress
  after insert on activity_events
  referencing new table as new_rows
  for each statement execute function refresh_progress_for_batch();

revoke execute on function recompute_progress(uuid) from public;
