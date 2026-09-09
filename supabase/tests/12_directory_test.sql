-- ============================================================================
-- SCHOOL DIRECTORY SUITE
--
-- The claim: a parent can FIND any school, and finding one grants nothing.
-- Only a verified tenant can ever see a child.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

insert into school_directory (id, name, town, region, source, external_ref)
values ('80000000-0000-0000-0000-000000000001',
        'Sacred Heart College Mankon', 'Bamenda', 'North West', 'osm', 'node/111'),
       ('80000000-0000-0000-0000-000000000002',
        'Sacred Heart Primary Douala', 'Douala', 'Littoral', 'osm', 'node/222');

-- A directory entry pointing at School A, as if it had since joined.
insert into school_directory (id, name, town, source, external_ref, verified_school_id)
values ('80000000-0000-0000-0000-000000000003',
        'School A', 'Bamenda', 'osm', 'node/333',
        '10000000-0000-0000-0000-00000000000a');

set role authenticated;
select test_as('00000000-0000-0000-0000-000000000001');   -- a parent

-- --- search covers both, platform first ---------------------------------------
select expect_count('Y01 an unjoined school is findable',
       (select count(*) from search_schools_all('Sacred Heart')
         where on_platform = false), 2);
select expect_count('Y02 a platform school is findable',
       (select count(*) from search_schools_all('School A')
         where on_platform = true), 1);
select expect_count('Y03 platform results come first',
       (select on_platform from search_schools_all('School A') limit 1)::int, 1);
select expect_count('Y04 a joined school is not also listed as unjoined',
       (select count(*) from search_schools_all('School A')
         where on_platform = false), 0);

-- --- finding a school grants NOTHING -----------------------------------------
select note_school_interest('80000000-0000-0000-0000-000000000001',
                            '30000000-0000-0000-0000-000000000001');

-- Scoped to ACTIVE: this child has a cancelled enrolment from an earlier
-- suite, and a cancelled row is exactly the thing that grants nothing.
select expect_count('Y05 naming a directory school creates no enrolment',
       (select count(*) from enrolments
         where student_id = '30000000-0000-0000-0000-000000000001'
           and status = 'active'), 0);
select expect_count('Y06 and the parent still belongs to no school',
       (select count(*) from my_schools()), 0);
select expect_count('Y07 and the directory entry is not a tenant',
       (select count(*) from schools
         where name = 'Sacred Heart College Mankon'), 0);

-- --- a parent cannot register interest for another person's child -------------
select expect_denied('Y08 cannot name a child you do not guardian', $sql$
  select note_school_interest('80000000-0000-0000-0000-000000000001',
                              '30000000-0000-0000-0000-0000000000a1') $sql$);

-- --- interest is private ------------------------------------------------------
select expect_count('Y09 a parent sees only their own interest',
       (select count(*) from directory_interest), 1);
select test_as('00000000-0000-0000-0000-000000000002');
select expect_count('Y10 another parent sees none of it',
       (select count(*) from directory_interest), 0);

-- --- the directory itself is not writable by clients --------------------------
select expect_denied('Y11 a parent cannot add a school to the directory', $sql$
  insert into school_directory (name, source) values ('Invented', 'manual') $sql$);
-- No update policy, so RLS filters the row out and the statement reports 0
-- rows rather than raising. The row count is the proof, not an exception.
select expect_no_write('Y12 a parent cannot promote an entry to a real school', $sql$
  update school_directory
     set verified_school_id = '10000000-0000-0000-0000-00000000000a'
   where id = '80000000-0000-0000-0000-000000000001' $sql$);

-- --- a school cannot use the directory to reach children ----------------------
select test_as('00000000-0000-0000-0000-00000000000a');   -- director of School A
select expect_count('Y13 a school sees no directory interest',
       (select count(*) from directory_interest), 0);
select expect_count('Y14 and gains no pupil from a directory entry',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-000000000001'), 0);

reset role;
select expect_count('Y12b and the entry is still unpromoted',
       (select count(*) from school_directory
         where id = '80000000-0000-0000-0000-000000000001'
           and verified_school_id is null), 1);
select expect_count('Y15 the waiting list is visible to the service role',
       (select families from directory_demand()
         where directory_id = '80000000-0000-0000-0000-000000000001'), 1);

reset role;
