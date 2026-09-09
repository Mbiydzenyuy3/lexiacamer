-- ============================================================================
-- DERIVED PROGRESS SUITE
--
-- progress is a cache over activity_events. These prove the arithmetic matches
-- src/App.jsx, that it survives replay, and that a device cannot mint stars.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

-- A clean student with a device token, so we exercise the real write path.
insert into students (id, display_name)
values ('30000000-0000-0000-0000-0000000000cc', 'Progress Child')
on conflict do nothing;

do $$
declare v_sid uuid;
begin
  select id into v_sid from students where display_name = 'Progress Child';
  insert into guardianships (student_id, profile_id)
       values (v_sid, '00000000-0000-0000-0000-000000000002')
  on conflict do nothing;
end;
$$;

set role authenticated;
select test_as('00000000-0000-0000-0000-000000000002');
select id as pid from students where display_name = 'Progress Child' \gset
select issue_device_grant(:'pid') as ptok \gset

-- --- 3 correct words = 3 words, streak 3, 15 stars --------------------------
set role anon;
select test_as(null);
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'word_completed',
                     'occurred_at', (now() - interval '3 min')::text),
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'word_completed',
                     'occurred_at', (now() - interval '2 min')::text),
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'word_completed',
                     'occurred_at', (now() - interval '1 min')::text)));

reset role;
select expect_count('P01 words counted from events',
       (select words from progress where student_id = :'pid'), 3);
select expect_count('P02 stars = 5 per word',
       (select stars from progress where student_id = :'pid'), 15);
select expect_count('P03 streak counts consecutive correct words',
       (select streak from progress where student_id = :'pid'), 3);

-- --- a miss resets the streak and records the letters ------------------------
set role anon;
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'word_missed',
                     'payload', jsonb_build_object('letters',
                                jsonb_build_array('A', 'TH', 'A')),
                     'occurred_at', now()::text)));

reset role;
select expect_count('P04 a miss resets the streak',
       (select streak from progress where student_id = :'pid'), 0);
select expect_count('P05 missed letters are tallied',
       (select (missed_phonemes->>'A')::int from progress
         where student_id = :'pid'), 2);
select expect_count('P06 words survive a miss',
       (select words from progress where student_id = :'pid'), 3);

-- --- a completed round is worth 20 ------------------------------------------
set role anon;
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'round_completed',
                     'occurred_at', now()::text)));
reset role;
select expect_count('P07 a round is worth 20 stars',
       (select stars from progress where student_id = :'pid'), 35);

-- --- unlocking a sticker SPENDS stars ---------------------------------------
set role anon;
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'sticker_unlocked',
                     'payload', jsonb_build_object('sticker_id', 'lion_cub'),
                     'occurred_at', now()::text)));
reset role;
select expect_count('P08 a sticker deducts its cost',
       (select stars from progress where student_id = :'pid'), 20);
select expect_count('P09 the sticker is recorded as unlocked',
       (select array_length(unlocked_stickers, 1) from progress
         where student_id = :'pid'), 1);

-- --- the device cannot mint stars by claiming them --------------------------
-- Scoring is decided by the database, so a payload asking for 9999 is ignored.
set role anon;
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'word_completed',
                     'payload', jsonb_build_object('stars', 9999),
                     'occurred_at', now()::text)));
reset role;
select expect_count('P10 a device cannot mint stars via the payload',
       (select stars from progress where student_id = :'pid'), 25);

-- --- replaying a batch does not double-count --------------------------------
select id as dup from activity_events
 where student_id = :'pid' and kind = 'round_completed' limit 1 \gset
set role anon;
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', :'dup', 'kind', 'round_completed',
                     'occurred_at', now()::text)));
reset role;
select expect_count('P11 replay does not inflate stars',
       (select stars from progress where student_id = :'pid'), 25);

-- --- the cache matches a fresh recomputation --------------------------------
select recompute_progress(:'pid');
select expect_count('P12 cache equals a full recompute',
       (select stars from progress where student_id = :'pid'), 25);

-- --- and the school still cannot read the un-windowed cache -----------------
set role authenticated;
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('P13 the cache stays guardian-only',
       (select count(*) from progress where student_id = :'pid'), 0);

reset role;

-- --- Phonics Lab: correct sounds score, and share ONE streak with Word Forge
-- Mirrors src/PhonicsLab.jsx (+2 a sound) and src/scoring.test.js.
set role anon;
select test_as(null);
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'phoneme_attempt',
                     'payload', jsonb_build_object('letter','A','correct',true),
                     'occurred_at', now()::text),
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'phoneme_attempt',
                     'payload', jsonb_build_object('letter','B','correct',true),
                     'occurred_at', now()::text)));
reset role;
select expect_count('P14 a correct sound is worth 2 stars',
       (select stars from progress where student_id = :'pid'), 29);
select expect_count('P15 correct sounds extend the shared streak',
       (select streak from progress where student_id = :'pid'), 3);

set role anon;
select sync_activity(:'ptok', jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'kind', 'phoneme_attempt',
                     'payload', jsonb_build_object('letter','C','correct',false),
                     'occurred_at', now()::text)));
reset role;
select expect_count('P16 a wrong sound breaks the shared streak',
       (select streak from progress where student_id = :'pid'), 0);
select expect_count('P17 a wrong sound scores nothing',
       (select stars from progress where student_id = :'pid'), 29);
