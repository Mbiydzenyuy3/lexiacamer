-- ============================================================================
-- PROFILE DETAILS SUITE
--
-- The claim under test: a school sees the child's name, age and gender, can
-- reach the parent's name and phone through one narrow function, and can NEVER
-- reach the home address.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

-- A parent with full details, whose child attends School A, class A1.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-0000000000c9', 'detailparent@test');

update profiles
   set full_name = 'Ngozi Mbeki', phone = '+237600000000'
 where id = '00000000-0000-0000-0000-0000000000c9';

insert into students (id, display_name, date_of_birth, gender)
values ('30000000-0000-0000-0000-0000000000aa', 'Detail Child',
        current_date - interval '6 years', 'female');

insert into guardianships (student_id, profile_id)
values ('30000000-0000-0000-0000-0000000000aa',
        '00000000-0000-0000-0000-0000000000c9');

insert into enrolments (student_id, class_id, school_id, status)
values ('30000000-0000-0000-0000-0000000000aa',
        '20000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-00000000000a', 'active');

insert into guardian_addresses (profile_id, line1, neighbourhood, city)
values ('00000000-0000-0000-0000-0000000000c9',
        '12 Rue de la Paix', 'Bonamoussadi', 'Douala');

set role authenticated;

-- --- the school sees the child's details ------------------------------------
select test_as('00000000-0000-0000-0000-0000000000a1');   -- teacher of A1
select expect_count('D01 teacher sees the child',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000aa'), 1);
select expect_count('D02 teacher sees the birth date, so can show an age',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000aa'
           and date_of_birth is not null), 1);
select expect_count('D03 teacher sees gender',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000aa'
           and gender = 'female'), 1);

-- --- and can reach the parent's contact details ------------------------------
select expect_count('D04 teacher can reach the parent name and phone',
       (select count(*) from student_contacts('30000000-0000-0000-0000-0000000000aa')
         where guardian_name = 'Ngozi Mbeki'
           and guardian_phone = '+237600000000'), 1);

-- --- but NEVER the home address ----------------------------------------------
select expect_count('D05 teacher cannot read the address table',
       (select count(*) from guardian_addresses), 0);
select expect_denied('D06 there is no function exposing an address', $sql$
  select student_address('30000000-0000-0000-0000-0000000000aa') $sql$);
select expect_count('D07 teacher cannot read profiles directly',
       (select count(*) from profiles
         where id = '00000000-0000-0000-0000-0000000000c9'), 0);

-- --- a director of the same school gets the same access ----------------------
select test_as('00000000-0000-0000-0000-00000000000a');
select expect_count('D08 director can reach contacts',
       (select count(*) from student_contacts('30000000-0000-0000-0000-0000000000aa')), 1);
select expect_count('D09 director still cannot read the address',
       (select count(*) from guardian_addresses), 0);

-- --- another school gets nothing ---------------------------------------------
select test_as('00000000-0000-0000-0000-00000000000b');
select expect_count('D10 another school cannot reach the contacts',
       (select count(*) from student_contacts('30000000-0000-0000-0000-0000000000aa')), 0);

-- --- a stranger gets nothing --------------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000ff');
select expect_count('D11 a stranger cannot reach the contacts',
       (select count(*) from student_contacts('30000000-0000-0000-0000-0000000000aa')), 0);
select expect_count('D12 a stranger cannot read the address',
       (select count(*) from guardian_addresses), 0);

-- --- the parent owns their own details ---------------------------------------
select test_as('00000000-0000-0000-0000-0000000000c9');
select expect_count('D13 the parent reads their own address',
       (select count(*) from guardian_addresses
         where city = 'Douala'), 1);
select expect_count('D14 the parent reads their own profile',
       (select count(*) from profiles
         where full_name = 'Ngozi Mbeki'), 1);

select update_my_profile('Ngozi A. Mbeki', '+237611111111');
select expect_count('D15 the parent can update their own details',
       (select count(*) from profiles
         where id = '00000000-0000-0000-0000-0000000000c9'
           and full_name = 'Ngozi A. Mbeki'), 1);

select update_student_details('30000000-0000-0000-0000-0000000000aa',
                              'Detail Child', (current_date - interval '7 years')::date, 'other');
select expect_count('D16 the parent can update their child''s details',
       (select count(*) from students
         where id = '30000000-0000-0000-0000-0000000000aa'
           and gender = 'other'), 1);

-- --- but not somebody else's --------------------------------------------------
select expect_denied('D17 a parent cannot edit another child', $sql$
  select update_student_details('30000000-0000-0000-0000-0000000000a1',
                                'Hijacked', null, 'other') $sql$);

-- --- a departed teacher loses the contact list too ----------------------------
-- A stale roster must not remain a list of parents' phone numbers.
reset role;
update school_members set ended_on = current_date
 where profile_id = '00000000-0000-0000-0000-0000000000a1';
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('D18 a departed teacher cannot reach contacts',
       (select count(*) from student_contacts('30000000-0000-0000-0000-0000000000aa')), 0);
reset role;
update school_members set ended_on = null
 where profile_id = '00000000-0000-0000-0000-0000000000a1';

-- --- a birth date must be plausible -------------------------------------------
select expect_no_write('D19 an impossible birth date is rejected', $sql$
  update students set date_of_birth = current_date + interval '1 year'
   where id = '30000000-0000-0000-0000-0000000000aa' $sql$);

reset role;
