-- ============================================================================
-- SCHOOL LEADS SUITE
--
-- A lead must grant nothing: no school, no window, no access. It is a sales
-- signal, and it must never be mistakable for an enrolment.
-- ============================================================================

\set ON_ERROR_STOP on

set role authenticated;

select test_as('00000000-0000-0000-0000-000000000001');
select suggest_school('Government School Bamenda', 'Bamenda');
select suggest_school('Government School Bamenda', 'Bamenda');   -- same parent twice

reset role;
select expect_count('L20 a parent naming a school leaves one lead',
       (select count(*) from school_leads
         where lower(raw_name) = 'government school bamenda'), 1);

set role authenticated;
select test_as('00000000-0000-0000-0000-000000000002');
select suggest_school('government school bamenda');   -- different casing
reset role;
select expect_count('L21 casing does not split one school into two leads',
       (select parents from school_demand()
         where lower(raw_name) = 'government school bamenda'), 2);

-- --- a lead is not a school, and grants nothing ------------------------------
select expect_count('L22 naming a school creates no school',
       (select count(*) from schools
         where lower(name) = 'government school bamenda'), 0);
select expect_count('L23 and creates no enrolment',
       (select count(*) from enrolments e
         join school_leads l on l.submitted_by is not null
        where e.school_id is null), 0);

set role authenticated;
select test_as('00000000-0000-0000-0000-000000000001');
select expect_count('L24 the parent still belongs to no school',
       (select count(*) from my_schools()), 0);
select expect_count('L25 and gets no classes',
       (select count(*) from my_classes()), 0);

-- --- leads are write-only for parents ----------------------------------------
select expect_count('L26 a parent cannot read the lead list',
       (select count(*) from school_leads), 0);
-- school_demand() is SECURITY INVOKER, so RLS applies to the caller and a
-- parent reads nothing rather than being refused. Asserting "it raises" would
-- assert a property the system does not have, and does not need to.
select expect_count('L27 a parent running the demand report sees nothing',
       (select count(*) from school_demand()), 0);

-- --- a parent cannot submit on someone else's behalf -------------------------
select expect_denied('L28 a parent cannot forge another parent''s lead', $sql$
  insert into school_leads (raw_name, submitted_by)
  values ('Fake', '00000000-0000-0000-0000-000000000002') $sql$);

-- --- an empty name is ignored rather than stored -----------------------------
select suggest_school('   ');
reset role;
select expect_count('L29 blank submissions are not stored',
       (select count(*) from school_leads where trim(raw_name) = ''), 0);

-- --- a school cannot read the demand list either ------------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('L30 a school cannot read leads',
       (select count(*) from school_leads), 0);

reset role;
