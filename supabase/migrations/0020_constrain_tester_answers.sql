-- ============================================================================
-- CONSTRAIN THE TESTER ANSWERS THAT THE UI ALREADY CONSTRAINS
--
-- `role` was always an enum-style check. `wants_help_with` was not: it had a
-- length limit and nothing else. In the app it is a chip picker with five
-- fixed options, so it LOOKED like a closed set -- but the column is written
-- by `anon` through PostgREST with `with check (true)`, and the anon key ships
-- in the browser bundle by design. Anyone could put 120 characters of anything
-- in it.
--
-- That mattered because the value is read back out by scripts/posts.mjs and
-- becomes the headline of a Facebook post: interpolated into an HTML card that
-- a local headless browser renders, and into the post text a human then pastes
-- onto the page. The renderer now escapes and runs with the network blocked,
-- and the generator re-checks the value, but neither of those helps the plain
-- text of a post. The real fix is that the column should never have accepted
-- the value in the first place.
--
-- Keep this list in step with GOALS in src/EarlyTester.jsx.
-- ============================================================================

-- Anything already stored outside the allowed set is cleared rather than
-- blocking the migration: it is a single optional answer, and a null is more
-- honest than a value we are no longer willing to display.
update testers
   set wants_help_with = null
 where wants_help_with is not null
   and wants_help_with not in ('Letter sounds', 'Reading words', 'Spelling',
                               'Confidence', 'Not sure yet');

alter table testers
  add constraint testers_wants_help_with_allowed
  check (
    wants_help_with is null
    or wants_help_with in ('Letter sounds', 'Reading words', 'Spelling',
                           'Confidence', 'Not sure yet')
  );
