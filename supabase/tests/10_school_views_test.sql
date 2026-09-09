-- ============================================================================
-- SCHOOL-SIDE READ SUITE
--
-- Claims: routing is derived from grants rather than declared; a teacher sees
-- only the classes they teach while a director sees all of them; and roster
-- progress is windowed, so a transferred child shows the work done HERE.
-- ============================================================================

\set ON_ERROR_STOP on

set role authenticated;

-- --- routing comes from grants, not from a signup answer ---------------------
select test_as('00000000-0000-0000-0000-000000000001');   -- a parent
select expect_count('R01 a parent belongs to no school',
       (select count(*) from my_schools()), 0);
select expect_count('R02 a parent has no classes',
       (select count(*) from my_classes()), 0);

select test_as('00000000-0000-0000-0000-0000000000ff');   -- signed up as "school"
select expect_count('R03 declaring "school" at signup grants no school',
       (select count(*) from my_schools()), 0);

-- --- a teacher sees only the classes they teach ------------------------------
select test_as('00000000-0000-0000-0000-0000000000a1');   -- teaches A1 only
select expect_count('R04 teacher belongs to one school',
       (select count(*) from my_schools()), 1);
select expect_count('R05 teacher sees only their own class',
       (select count(*) from my_classes()), 1);
select expect_count('R06 and it is the right one',
       (select count(*) from my_classes()
         where class_id = '20000000-0000-0000-0000-0000000000a1'), 1);

-- --- a director sees every class in their school -----------------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('R07 director sees all classes in the school',
       (select count(*) from my_classes()
         where school_id = '10000000-0000-0000-0000-00000000000a'), 2);
select expect_count('R08 director sees no other school''s classes',
       (select count(*) from my_classes()
         where school_id = '10000000-0000-0000-0000-00000000000b'), 0);

-- --- the roster carries progress --------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('R09 roster lists the class''s students',
       (select count(*) from class_roster('20000000-0000-0000-0000-0000000000a1')
         where display_name = 'Student A1'), 1);
select expect_count('R10 roster counts words done in this class',
       (select words from class_roster('20000000-0000-0000-0000-0000000000a1')
         where display_name = 'Student A1'), 1);

-- --- a teacher cannot pull another class's roster ----------------------------
select expect_count('R11 teacher gets nothing for a class they do not teach',
       (select count(*) from class_roster('20000000-0000-0000-0000-0000000000a2')), 0);
select expect_count('R12 teacher gets nothing for another school''s class',
       (select count(*) from class_roster('20000000-0000-0000-0000-0000000000b1')), 0);

-- --- THE WINDOW: a transferred child shows only work done HERE ---------------
-- Transfer Child was at School A Jan-Mar (one event in Feb), then School B
-- from April (one event in May).
select test_as('00000000-0000-0000-0000-00000000000a');   -- director of A
select expect_count('R13 School A sees the transfer child',
       (select count(*) from class_roster('20000000-0000-0000-0000-0000000000a1')
         where display_name = 'Transfer Child'), 1);
select expect_count('R14 and counts only the work done at School A',
       (select words from class_roster('20000000-0000-0000-0000-0000000000a1')
         where display_name = 'Transfer Child'), 1);

select test_as('00000000-0000-0000-0000-00000000000b');   -- director of B
select expect_count('R15 School B counts only the work done at School B',
       (select words from class_roster('20000000-0000-0000-0000-0000000000b1')
         where display_name = 'Transfer Child'), 1);

-- --- a departed teacher gets an empty roster ---------------------------------
select test_as('00000000-0000-0000-0000-0000000000ae');
select expect_count('R16 a departed teacher has no classes',
       (select count(*) from my_classes()), 0);
select expect_count('R17 and an empty roster even naming the class',
       (select count(*) from class_roster('20000000-0000-0000-0000-0000000000a1')), 0);

-- --- a stranger gets nothing --------------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_count('R18 a stranger gets an empty roster',
       (select count(*) from class_roster('20000000-0000-0000-0000-0000000000a1')), 0);

-- --- a suspended school disappears from routing ------------------------------
reset role;
update schools set status = 'suspended'
 where id = '10000000-0000-0000-0000-00000000000a';
set role authenticated;
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('R19 a suspended school leaves the director with nothing',
       (select count(*) from my_schools()), 0);
select expect_count('R20 and no classes',
       (select count(*) from my_classes()), 0);
reset role;
update schools set status = 'active'
 where id = '10000000-0000-0000-0000-00000000000a';

reset role;
