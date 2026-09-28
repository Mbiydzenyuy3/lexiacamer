-- ============================================================================
-- CONSENT SUITE
--
-- The claim under test: no child exists on the server without a recorded
-- parent consent and the child's own OK; a school gets nothing without the
-- parent's separate school consent; and withdrawing either one actually takes
-- the data or the access away.
-- ============================================================================

\set ON_ERROR_STOP on

reset role;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000c051', 'consent.parent@test'),
  ('00000000-0000-0000-0000-00000000c052', 'consent.stranger@test'),
  ('00000000-0000-0000-0000-00000000c053', 'consent.leaver@test');

set role authenticated;
select test_as('00000000-0000-0000-0000-00000000c051');

-- --- no consent, no child -----------------------------------------------------
select expect_denied('C01 no consent version: no child', $sql$
  select create_student('Amina', 'lion', null, true) $sql$);
select expect_denied('C02 no child assent: no child', $sql$
  select create_student('Amina', 'lion', '2026-09-29', false) $sql$);
select expect_denied('C03 the old two-argument call is refused', $sql$
  select create_student('Amina', 'lion') $sql$);
reset role;
select expect_count('C04 and nothing was created',
       (select count(*) from students where display_name = 'Amina'), 0);
set role authenticated;
select test_as('00000000-0000-0000-0000-00000000c051');

-- --- with both, the child and its consent arrive together ---------------------
select create_student('Amina', 'lion', '2026-09-29', true) as amina \gset
reset role;
select expect_count('C05 the consented child is created',
       (select count(*) from students where id = :'amina'), 1);
select expect_count('C06 with a progress_sync consent carrying the child''s OK',
       (select count(*) from consents
         where student_id = :'amina' and purpose = 'progress_sync'
           and wording_version = '2026-09-29'
           and child_assent_at is not null and withdrawn_at is null), 1);
set role authenticated;

-- --- consents are read-only to their owner, invisible to anyone else ----------
select test_as('00000000-0000-0000-0000-00000000c051');
select expect_count('C07 the parent can read their own consent',
       (select count(*) from consents where student_id = :'amina'), 1);
select expect_denied('C08 a parent cannot write a consent row directly', $sql$
  insert into consents (profile_id, student_id, purpose, wording_version)
  values ('00000000-0000-0000-0000-00000000c051',
          '$sql$ || :'amina' || $sql$', 'school_share', 'forged') $sql$);
select expect_no_write('C09 a parent cannot edit their consent row', $sql$
  update consents set wording_version = 'forged'
   where student_id = '$sql$ || :'amina' || $sql$' $sql$);
select expect_no_write('C10 a parent cannot delete their consent row', $sql$
  delete from consents where student_id = '$sql$ || :'amina' || $sql$' $sql$);
select test_as('00000000-0000-0000-0000-00000000c052');
select expect_count('C11 a stranger sees none of it',
       (select count(*) from consents where student_id = :'amina'), 0);

-- --- school sharing needs its own consent ------------------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-00000000c052');
select expect_denied('C12 a stranger cannot give school consent for this child', $sql$
  select give_consent('$sql$ || :'amina' || $sql$', 'school_share', '2026-09-29') $sql$);

select test_as('00000000-0000-0000-0000-00000000c051');
select expect_denied('C13 no school consent: no enrolment', $sql$
  select claim_school_place('$sql$ || :'amina' || $sql$',
                            '20000000-0000-0000-0000-0000000000a1') $sql$);
select expect_denied('C14 no school consent: no directory interest', $sql$
  select note_school_interest('80000000-0000-0000-0000-000000000001',
                              '$sql$ || :'amina' || $sql$') $sql$);
select expect_denied('C15 progress_sync cannot be given through give_consent', $sql$
  select give_consent('$sql$ || :'amina' || $sql$', 'progress_sync', '2026-09-29') $sql$);
select expect_denied('C15b a null purpose is refused', $sql$
  select give_consent('$sql$ || :'amina' || $sql$', null, '2026-09-29') $sql$);

select give_consent(:'amina', 'school_share', '2026-09-29');
select give_consent(:'amina', 'school_share', '2026-09-29');
select expect_count('C16 giving school consent twice keeps one live row',
       (select count(*) from consents
         where student_id = :'amina' and purpose = 'school_share'
           and withdrawn_at is null), 1);

select claim_school_place(:'amina', '20000000-0000-0000-0000-0000000000a1') as amina_e \gset
select note_school_interest('80000000-0000-0000-0000-000000000001', :'amina');
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('C17 with consent, the class teacher sees the child',
       (select count(*) from students where id = :'amina'), 1);

-- --- stopping school sharing takes the school's access away -------------------
select test_as('00000000-0000-0000-0000-00000000c051');
select withdraw_consent(:'amina', 'school_share');
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('C18 the teacher no longer sees the child',
       (select count(*) from students where id = :'amina'), 0);
reset role;
select expect_count('C19 the enrolment is cancelled',
       (select count(*) from enrolments
         where id = :'amina_e' and status = 'cancelled'), 1);
select expect_count('C20 the directory interest is gone',
       (select count(*) from directory_interest where student_id = :'amina'), 0);
select expect_count('C21 the school consent is withdrawn, not deleted',
       (select count(*) from consents
         where student_id = :'amina' and purpose = 'school_share'
           and withdrawn_at is not null), 1);
set role authenticated;

-- --- deleting the child's data ------------------------------------------------
select test_as('00000000-0000-0000-0000-00000000c052');
select expect_denied('C22 a stranger cannot delete someone else''s child', $sql$
  select withdraw_consent('$sql$ || :'amina' || $sql$', 'progress_sync') $sql$);

select test_as('00000000-0000-0000-0000-00000000c051');
select expect_denied('C22b a null purpose is refused', $sql$
  select withdraw_consent('$sql$ || :'amina' || $sql$', null) $sql$);
select withdraw_consent(:'amina', 'progress_sync');
reset role;
select expect_count('C23 the child is gone',
       (select count(*) from students where id = :'amina'), 0);
select expect_count('C24 with their progress',
       (select count(*) from progress where student_id = :'amina'), 0);
select expect_count('C25 both consent records remain, withdrawn, with no child',
       (select count(*) from consents
         where profile_id = '00000000-0000-0000-0000-00000000c051'
           and student_id is null and withdrawn_at is not null), 2);
set role authenticated;

-- --- deleting the account -----------------------------------------------------
select test_as('00000000-0000-0000-0000-00000000c053');
select create_student('Kofi', 'dog', '2026-09-29', true) as kofi \gset
select delete_my_account();
reset role;
select expect_count('C26 the account is gone',
       (select count(*) from auth.users
         where id = '00000000-0000-0000-0000-00000000c053'), 0);
select expect_count('C27 the profile is gone',
       (select count(*) from profiles
         where id = '00000000-0000-0000-0000-00000000c053'), 0);
select expect_count('C28 the child is gone',
       (select count(*) from students where id = :'kofi'), 0);
select expect_count('C29 a withdrawn record remains, attached to no one',
       (select count(*) from consents
         where profile_id is null and student_id is null
           and withdrawn_at is not null), 1);
set role authenticated;

-- --- no more home addresses ---------------------------------------------------
select test_as('00000000-0000-0000-0000-00000000c052');
select expect_denied('C30 nobody can store a home address any more', $sql$
  insert into guardian_addresses (profile_id, city)
  values ('00000000-0000-0000-0000-00000000c052', 'Douala') $sql$);


-- --- stopping school sharing also covers a class the child already left -------
-- A transfer ENDS the old enrolment, and an ended enrolment still shows the
-- old class the period it taught. "Stop sharing" must take that away too.
select test_as('00000000-0000-0000-0000-00000000c051');
select create_student('Tana', 'lion', '2026-09-29', true) as tana \gset
select give_consent(:'tana', 'school_share', '2026-09-29');
select claim_school_place(:'tana', '20000000-0000-0000-0000-0000000000a1');
select transfer_school_place(:'tana', '20000000-0000-0000-0000-0000000000a2');
select withdraw_consent(:'tana', 'school_share');
select test_as('00000000-0000-0000-0000-0000000000a1');
select expect_count('C31 the old class no longer sees a child after withdrawal',
       (select count(*) from students where id = :'tana'), 0);
select test_as('00000000-0000-0000-0000-0000000000a2');
select expect_count('C32 nor does the new class',
       (select count(*) from students where id = :'tana'), 0);

reset role;
