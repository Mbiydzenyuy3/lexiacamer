-- ============================================================================
-- SUMMARY — runs after every suite. Fails the build if anything regressed.
-- ============================================================================
reset role;

\echo ''
\echo '================ LEXIACAMER SECURITY SUITE ================'
select case when passed then 'PASS' else '>>> FAIL' end as result,
       label, detail
  from test_results
 order by label;

do $$
declare v_failed int;
begin
  select count(*) into v_failed from test_results where not passed;
  if v_failed > 0 then
    raise exception '% TEST(S) FAILED', v_failed;
  end if;
  raise notice 'ALL % TESTS PASSED', (select count(*) from test_results);
end;
$$;
