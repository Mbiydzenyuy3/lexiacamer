# Parental Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No child's data reaches the server without a recorded parent consent and the child's own OK; a parent can share with a school separately, download, stop sharing, delete the child's data, and delete their account.

**Architecture:** A new `consents` table written only by `security definer` functions. `create_student` records the consent in the same transaction that creates the child, and refuses without it. School sharing is enforced by a `before insert` trigger on `enrolments` and `directory_interest`, so it holds whichever version of `claim_school_place` is live. In the app, linking is gated on local consent state set by a new two-step consent screen; a "Your data" box drives withdrawal.

**Tech Stack:** Postgres/Supabase (plpgsql, RLS), React 18.3, Vite 7, Vitest 5 + jsdom (no Testing Library: render with `react-dom/client` and `act` from `react`).

**Spec:** `docs/superpowers/specs/2026-09-29-parental-consent-design.md`

## Global Constraints

- Branch: `early-testers`. It is production. Push only after all checks pass, and never before the migration is applied (Task 8).
- Migration file: `supabase/migrations/0021_consents.sql`. Do not edit earlier migrations.
- Consent wording version: `CONSENT_VERSION = '2026-09-29'`. Change it whenever the wording in `src/consentCopy.js` changes.
- Purposes are exactly `progress_sync` and `school_share`.
- School sharing needs the parent's consent only; `progress_sync` needs parent consent **and** child assent.
- The live DB has schools migrations 0012–0017 applied (`claim_school_place(p_student_id, p_class_id default null, p_school_id default null)`). Do not redefine `claim_school_place` or `note_school_interest`: enforce through triggers.
- Protection comes from RLS, not table grants: `01_grants.sql` and Supabase both grant `insert/update/delete` on every table to `authenticated`.
- Consent copy is in English and French. No pronouns for the child: repeat the name. French uses `d'` before a vowel (`de()` helper).
- Every task ends with `npm run lint` (0 errors), `npm test`, and, for SQL tasks, `./supabase/tests/run.sh` (needs Docker; prints `ALL N TESTS PASSED`).
- Commit messages end with: `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
- Never commit or push `.ai/` (the repo is public).

## Review Focus

1. **Erasing progress on a linked phone** (Parents page → reset): today it resets local state only, stranding the child's server record where the parent can no longer reach it. Expect: when linked, it deletes the server copy too, and needs internet. Test in Task 7.
2. **A `null` or unknown purpose** passed to `give_consent`/`withdraw_consent`: `null <> 'x'` is null in SQL, so a naive check lets it through. Expect: refused. Tests C15b/C25b in Task 1/3.
3. **Consent screen on a phone whose child was deleted elsewhere** (e.g. account deleted on another device): the next sync fails because the grant is gone. Expect: the app keeps working offline; no crash loop. Covered by `linkChild` returning state on error; checked in Task 7 browser QA step.
4. **French names starting with a vowel or h** ("Amina", "Hervé"): "de Amina" reads as a machine error and costs trust. Expect `d'Amina`. Unit test in Task 4.
5. **Double-tap on "Agree"** or StrictMode double-mount: must not create two children. Covered by the single in-flight `linkingRef` already in `App.jsx`, plus the unique live-consent index; checked in Task 5 test.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0021_consents.sql` (create) | consents table, RLS, `create_student` (4 args), `give_consent`, `withdraw_consent`, `delete_my_account`, school-share trigger, address write policies dropped |
| `supabase/tests/13_consent_test.sql` (create) | the consent suite |
| `supabase/tests/02_rls_test.sql`, `12_directory_test.sql`, `run.sh` (modify) | callers updated to the new rules |
| `src/consentCopy.js` (create) | exact EN/FR wording, `CONSENT_VERSION`, `de()` |
| `src/lib/dataRights.js` (create) | RPC wrappers for consent and data rights |
| `src/store.js` (modify) | `consent` in state, `linkChild` gate, `forgetServerLink` |
| `src/auth/ParentConsent.jsx` (create) | parent consent + child assent screens |
| `src/auth/YourData.jsx` (create) | download / stop sharing / delete / delete account |
| `src/App.jsx` (modify) | routing, linking gate, erase-when-linked |
| `src/auth/ParentOnboarding.jsx` (modify) | address step removed, school box |
| `src/ParentDashboard.jsx` (modify) | renders the `yourData` slot |
| `src/index.css` (modify) | a few consent styles |

---

### Task 1: Consents table and consent-gated `create_student`

**Files:**
- Create: `supabase/migrations/0021_consents.sql`
- Create: `supabase/tests/13_consent_test.sql`
- Modify: `supabase/tests/run.sh` (add 0021 after 0018, add 13 before 99)
- Modify: `supabase/tests/02_rls_test.sql:256,435,461,479,480` (create_student calls)

**Interfaces:**
- Produces: table `consents(id, profile_id, student_id, purpose, wording_version, child_assent_at, granted_at, withdrawn_at)`; `has_live_consent(p_student_id uuid, p_purpose text) returns boolean`; `create_student(p_name text, p_avatar text default 'lion', p_consent_version text default null, p_child_assent boolean default false) returns uuid`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/13_consent_test.sql`:

```sql
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
  ('00000000-0000-0000-0000-0000000000d1', 'consent.parent@test'),
  ('00000000-0000-0000-0000-0000000000d2', 'consent.stranger@test'),
  ('00000000-0000-0000-0000-0000000000d3', 'consent.leaver@test');

set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000d1');

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
select test_as('00000000-0000-0000-0000-0000000000d1');

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
select test_as('00000000-0000-0000-0000-0000000000d1');
select expect_count('C07 the parent can read their own consent',
       (select count(*) from consents where student_id = :'amina'), 1);
select expect_denied('C08 a parent cannot write a consent row directly', $sql$
  insert into consents (profile_id, student_id, purpose, wording_version)
  values ('00000000-0000-0000-0000-0000000000d1',
          '$sql$ || :'amina' || $sql$', 'school_share', 'forged') $sql$);
select expect_no_write('C09 a parent cannot edit their consent row', $sql$
  update consents set wording_version = 'forged'
   where student_id = '$sql$ || :'amina' || $sql$' $sql$);
select expect_no_write('C10 a parent cannot delete their consent row', $sql$
  delete from consents where student_id = '$sql$ || :'amina' || $sql$' $sql$);
select test_as('00000000-0000-0000-0000-0000000000d2');
select expect_count('C11 a stranger sees none of it',
       (select count(*) from consents where student_id = :'amina'), 0);

reset role;
```

In `supabase/tests/run.sh`, add after the `0018_pgcrypto_search_path.sql` line:

```bash
$PSQL -q -f supabase/migrations/0021_consents.sql
```

and before the `99_summary.sql` line:

```bash
$PSQL -q -f supabase/tests/13_consent_test.sql
```

- [ ] **Step 2: Run to verify it fails**

Run: `./supabase/tests/run.sh 2>&1 | tail -5`
Expected: FAIL, `supabase/migrations/0021_consents.sql: No such file or directory`.

- [ ] **Step 3: Write the migration (part 1)**

Create `supabase/migrations/0021_consents.sql`:

```sql
-- ============================================================================
-- CONSENT BEFORE A CHILD'S DATA LEAVES THE PHONE
--
-- Cameroon Law 2024/017: consent must be express, specific to each purpose,
-- given before processing, and for an under-18 given by a parent IN ADDITION
-- to the child. Spec: docs/superpowers/specs/2026-09-29-parental-consent-design.md
--
-- Two purposes, recorded separately:
--   progress_sync  save the child's progress to the parent's account.
--                  Needs the parent's consent AND the child's own OK.
--   school_share   let the child's school see it. The parent's decision alone.
--
-- Rows are never deleted by the app. Withdrawal sets withdrawn_at. When a
-- child or an account is deleted the ids null out, and what is left proves a
-- consent existed and was withdrawn, with no child data in it.
-- ============================================================================

create table consents (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references profiles(id) on delete set null,
  student_id      uuid references students(id) on delete set null,
  purpose         text not null
                  check (purpose in ('progress_sync', 'school_share')),
  wording_version text not null
                  check (char_length(wording_version) between 1 and 20),
  child_assent_at timestamptz,
  granted_at      timestamptz not null default now(),
  withdrawn_at    timestamptz,
  check (purpose <> 'progress_sync' or child_assent_at is not null)
);

create unique index consents_one_live
  on consents (student_id, purpose)
  where withdrawn_at is null and student_id is not null;
create index consents_profile_idx on consents (profile_id);

alter table consents enable row level security;

-- Read your own. No insert, update or delete policy: rows change only through
-- the functions below. Supabase grants table writes to `authenticated` by
-- default, so RLS is the only thing that makes this read-only. Do not add one.
create policy consents_own_select on consents for select
  using (profile_id = (select auth.uid()));

create or replace function has_live_consent(p_student_id uuid, p_purpose text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from consents
                  where student_id = p_student_id
                    and purpose = p_purpose
                    and withdrawn_at is null);
$$;

-- ----------------------------------------------------------------------------
-- create_student: the child and its consent are created together or not at all.
--
-- The two-argument version must be dropped, not just replaced: otherwise a
-- two-argument call from an old cached app would still match it. With it gone,
-- that call resolves to this one with null consent, and is refused.
-- ----------------------------------------------------------------------------
drop function if exists create_student(text, text);

create or replace function create_student(p_name            text,
                                          p_avatar          text    default 'lion',
                                          p_consent_version text    default null,
                                          p_child_assent    boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if coalesce(trim(p_consent_version), '') = ''
     or not coalesce(p_child_assent, false) then
    raise exception 'consent required' using errcode = '42501';
  end if;

  insert into students (display_name, avatar)
       values (p_name, coalesce(p_avatar, 'lion'))
    returning id into v_id;

  insert into guardianships (student_id, profile_id, relationship)
       values (v_id, v_uid, 'parent');

  insert into progress (student_id) values (v_id);

  insert into consents (profile_id, student_id, purpose,
                        wording_version, child_assent_at)
       values (v_uid, v_id, 'progress_sync', trim(p_consent_version), now());

  return v_id;
end;
$$;

revoke execute on function has_live_consent(uuid, text) from public;
revoke execute on function create_student(text, text, text, boolean) from public;
grant  execute on function create_student(text, text, text, boolean) to authenticated;
```

- [ ] **Step 4: Update the existing callers in `02_rls_test.sql`**

Each `create_student('<name>')` becomes `create_student('<name>', 'lion', 'test', true)`. The five lines:

```sql
select create_student('Parent2 Child', 'lion', 'test', true) as new_child \gset
select create_student('Claim Test', 'lion', 'test', true) as s2 \gset
select create_student('Mover', 'lion', 'test', true) as sm \gset
select create_student('Sibling One', 'lion', 'test', true) as k1 \gset
select create_student('Sibling Two', 'lion', 'test', true) as k2 \gset
```

- [ ] **Step 5: Run to verify C01–C11 pass**

Run: `./supabase/tests/run.sh 2>&1 | grep -E "FAIL|C0|C1|TESTS PASSED"`
Expected: C01–C11 `PASS` and `ALL N TESTS PASSED`. (Suite 02's `claim_school_place` calls still pass here: the school-share trigger only arrives in Task 2.)

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0021_consents.sql supabase/tests/13_consent_test.sql supabase/tests/run.sh supabase/tests/02_rls_test.sql
git commit -m "feat(db): no child on the server without recorded consent

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: School sharing needs its own consent

**Files:**
- Modify: `supabase/migrations/0021_consents.sql` (append)
- Modify: `supabase/tests/13_consent_test.sql` (append before the final `reset role;`)
- Modify: `supabase/tests/02_rls_test.sql` (give consent before each `claim_school_place` the test expects to succeed)
- Modify: `supabase/tests/12_directory_test.sql` (give consent before `note_school_interest` at line 41)

**Interfaces:**
- Consumes: `has_live_consent` (Task 1).
- Produces: `give_consent(p_student_id uuid, p_purpose text, p_version text) returns void`; trigger function `require_school_share()`.

- [ ] **Step 1: Write the failing tests**

Append to `13_consent_test.sql` (before the last `reset role;`):

```sql
-- --- school sharing needs its own consent ------------------------------------
set role authenticated;
select test_as('00000000-0000-0000-0000-0000000000d2');
select expect_denied('C12 a stranger cannot give school consent for this child', $sql$
  select give_consent('$sql$ || :'amina' || $sql$', 'school_share', '2026-09-29') $sql$);

select test_as('00000000-0000-0000-0000-0000000000d1');
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `./supabase/tests/run.sh 2>&1 | grep -E "FAIL|C1[2-7]|ERROR"`
Expected: FAIL: `function give_consent(uuid, unknown, unknown) does not exist`.

- [ ] **Step 3: Append to the migration**

```sql
-- ----------------------------------------------------------------------------
-- School sharing: the parent's separate, optional decision.
-- ----------------------------------------------------------------------------
create or replace function give_consent(p_student_id uuid,
                                        p_purpose    text,
                                        p_version    text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  -- `is distinct from`, not `<>`: a null purpose must be refused, and
  -- `null <> 'school_share'` is null, which an IF treats as false.
  if p_purpose is distinct from 'school_share' then
    raise exception 'only school_share is given here; progress_sync comes with create_student'
      using errcode = '22023';
  end if;

  if not exists (select 1 from guardianships g
                  where g.student_id = p_student_id
                    and g.profile_id = v_uid
                    and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  if has_live_consent(p_student_id, 'school_share') then
    return;                                   -- idempotent
  end if;

  insert into consents (profile_id, student_id, purpose, wording_version)
       values (v_uid, p_student_id, 'school_share', trim(p_version));
end;
$$;

-- Enforced on the rows, not in claim_school_place / note_school_interest.
-- The live database runs a newer claim_school_place (schools migration 0014)
-- than this branch defines; redefining it here would create a second,
-- conflicting overload. A trigger holds whichever version is live.
--
-- Only app requests are checked. PostgREST sets `role` to `authenticated` for a
-- signed-in user, and a security definer function does not change that
-- setting, so going through a function does not bypass this. Maintainer
-- scripts (service_role) and migrations are not app requests.
create or replace function require_school_share()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('role', true), 'none')
       not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Interest noted without naming a child carries no child data.
  if new.student_id is null then
    return new;
  end if;

  if not has_live_consent(new.student_id, 'school_share') then
    raise exception 'school sharing consent required' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger enrolments_require_school_share
  before insert on enrolments
  for each row execute function require_school_share();

create trigger directory_interest_require_school_share
  before insert on directory_interest
  for each row execute function require_school_share();

revoke execute on function give_consent(uuid, text, text) from public;
grant  execute on function give_consent(uuid, text, text) to authenticated;
```

- [ ] **Step 4: Update suites 02 and 12 for the new rule**

In `02_rls_test.sql`, add a `give_consent` immediately before each `claim_school_place` that is expected to succeed (the attacker call at line 188 stays as is: it must still be denied):

```sql
-- before line 403
select give_consent('30000000-0000-0000-0000-000000000001', 'school_share', 'test');
-- before line 436
select give_consent(:'s2', 'school_share', 'test');
-- before line 462 (also covers the refused second claim at 466 and the transfer)
select give_consent(:'sm', 'school_share', 'test');
-- before line 481
select give_consent(:'k1', 'school_share', 'test');
select give_consent(:'k2', 'school_share', 'test');
```

In `12_directory_test.sql`, before line 41:

```sql
select give_consent('30000000-0000-0000-0000-000000000001', 'school_share', 'test');
```

- [ ] **Step 5: Run to verify everything passes**

Run: `./supabase/tests/run.sh 2>&1 | grep -E "FAIL|TESTS PASSED"`
Expected: `ALL N TESTS PASSED`, no `FAIL`. If another suite fails with `school sharing consent required`, it is a test inserting an enrolment as `authenticated` for a child it legitimately guardians: add `select give_consent(<student>, 'school_share', 'test');` right before that call, the same way. Never loosen the trigger to make a test pass.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0021_consents.sql supabase/tests/13_consent_test.sql supabase/tests/02_rls_test.sql supabase/tests/12_directory_test.sql
git commit -m "feat(db): a school sees nothing without the parent's school consent

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Withdrawal, account deletion, no more addresses

**Files:**
- Modify: `supabase/migrations/0021_consents.sql` (append)
- Modify: `supabase/tests/13_consent_test.sql` (append before the final `reset role;`)

**Interfaces:**
- Consumes: `has_live_consent`, existing `cancel_enrolment(p_enrolment_id uuid, p_note text default null)`, `delete_student(p_student_id uuid)`.
- Produces: `withdraw_consent(p_student_id uuid, p_purpose text) returns void`; `delete_my_account() returns void`.

- [ ] **Step 1: Write the failing tests**

```sql
-- --- stopping school sharing takes the school's access away -------------------
select test_as('00000000-0000-0000-0000-0000000000d1');
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
select test_as('00000000-0000-0000-0000-0000000000d2');
select expect_denied('C22 a stranger cannot delete someone else''s child', $sql$
  select withdraw_consent('$sql$ || :'amina' || $sql$', 'progress_sync') $sql$);

select test_as('00000000-0000-0000-0000-0000000000d1');
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
         where profile_id = '00000000-0000-0000-0000-0000000000d1'
           and student_id is null and withdrawn_at is not null), 2);
set role authenticated;

-- --- deleting the account -----------------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000d3');
select create_student('Kofi', 'dog', '2026-09-29', true) as kofi \gset
select delete_my_account();
reset role;
select expect_count('C26 the account is gone',
       (select count(*) from auth.users
         where id = '00000000-0000-0000-0000-0000000000d3'), 0);
select expect_count('C27 the profile is gone',
       (select count(*) from profiles
         where id = '00000000-0000-0000-0000-0000000000d3'), 0);
select expect_count('C28 the child is gone',
       (select count(*) from students where id = :'kofi'), 0);
select expect_count('C29 a withdrawn record remains, attached to no one',
       (select count(*) from consents
         where profile_id is null and student_id is null
           and withdrawn_at is not null), 1);
set role authenticated;

-- --- no more home addresses ---------------------------------------------------
select test_as('00000000-0000-0000-0000-0000000000d2');
select expect_denied('C30 nobody can store a home address any more', $sql$
  insert into guardian_addresses (profile_id, city)
  values ('00000000-0000-0000-0000-0000000000d2', 'Douala') $sql$);
```

- [ ] **Step 2: Run to verify they fail**

Run: `./supabase/tests/run.sh 2>&1 | grep -E "FAIL|C1[89]|C2|C3|ERROR"`
Expected: FAIL: `function withdraw_consent(uuid, unknown) does not exist`.

- [ ] **Step 3: Append to the migration**

```sql
-- ----------------------------------------------------------------------------
-- Withdrawal. It takes effect, not just gets noted.
-- ----------------------------------------------------------------------------
create or replace function withdraw_consent(p_student_id uuid, p_purpose text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_e   uuid;
begin
  if p_purpose is null or p_purpose not in ('progress_sync', 'school_share') then
    raise exception 'unknown purpose' using errcode = '22023';
  end if;

  if not exists (select 1 from guardianships g
                  where g.student_id = p_student_id
                    and g.profile_id = v_uid
                    and g.ended_at is null) then
    raise exception 'not a guardian of this student' using errcode = '42501';
  end if;

  if p_purpose = 'school_share' then
    update consents set withdrawn_at = now()
     where student_id = p_student_id and purpose = 'school_share'
       and withdrawn_at is null;

    -- cancelled, not ended: "turn it off" means the school keeps nothing,
    -- and 0001 defines cancelled as producing no window at all.
    for v_e in select id from enrolments
                where student_id = p_student_id and status = 'active' loop
      perform cancel_enrolment(v_e, 'parent withdrew school consent');
    end loop;

    delete from directory_interest where student_id = p_student_id;
    return;
  end if;

  -- progress_sync: withdraw both purposes, then delete through the one audited
  -- path (0005), which keeps only an anonymous billing count.
  update consents set withdrawn_at = now()
   where student_id = p_student_id and withdrawn_at is null;
  perform delete_student(p_student_id);
end;
$$;

-- ----------------------------------------------------------------------------
-- Delete my account: the consent screen promises "delete all of it", and that
-- includes the email. profiles cascades from auth.users, guardianships from
-- profiles, and the 0005 orphan trigger deletes a child left with no guardian
-- (a child with another live guardian is kept, for them).
-- ----------------------------------------------------------------------------
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update consents set withdrawn_at = now()
   where profile_id = v_uid and withdrawn_at is null;

  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function withdraw_consent(uuid, text) from public;
revoke execute on function delete_my_account()          from public;
grant  execute on function withdraw_consent(uuid, text) to authenticated;
grant  execute on function delete_my_account()          to authenticated;

-- ----------------------------------------------------------------------------
-- No more home addresses. Dropping the write policies (not revoking grants,
-- which Supabase re-grants by default) makes RLS refuse every write, from any
-- version of the app. The table stays: the paused schools branch shares this
-- database, and reading your own row still works.
-- ----------------------------------------------------------------------------
drop policy if exists own_address_insert on guardian_addresses;
drop policy if exists own_address_update on guardian_addresses;
```

- [ ] **Step 4: Run to verify everything passes**

Run: `./supabase/tests/run.sh 2>&1 | grep -E "FAIL|TESTS PASSED"`
Expected: `ALL N TESTS PASSED`. If `C26` fails because the shim's `auth.users` has no cascade to `profiles`, check `profiles.id references auth.users(id) on delete cascade` is present (it is, in 0001) and that `02_rls_test.sql` test 40 still bootstraps profiles; do not weaken the test.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0021_consents.sql supabase/tests/13_consent_test.sql
git commit -m "feat(db): withdrawing consent takes the data or the access away

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Consent wording, data-rights calls, and the store gate

**Files:**
- Create: `src/consentCopy.js`, `src/consentCopy.test.js`
- Create: `src/lib/dataRights.js`, `src/lib/dataRights.test.js`
- Modify: `src/store.js` (`defaultState`, `linkChild`, new `forgetServerLink`)
- Modify: `src/store.test.js` (append)

**Interfaces:**
- Produces:
  - `CONSENT_VERSION: string`, `copyFor(lang: 'en'|'fr'): Copy`, `de(name: string): string` from `src/consentCopy.js`
  - from `src/lib/dataRights.js`: `exportChild(studentId) → Promise<object>`, `giveSchoolConsent(studentId) → Promise<void>`, `stopSchoolSharing(studentId) → Promise<void>`, `deleteChildData(studentId) → Promise<void>`, `deleteMyAccount() → Promise<void>`, `hasSchoolSharing(studentId) → Promise<boolean>`
  - `state.consent: null | { version: string, childAssent: boolean }`; `forgetServerLink(state) → state`

- [ ] **Step 1: Write the failing tests**

`src/consentCopy.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { CONSENT_VERSION, copyFor, de } from './consentCopy';

describe('consentCopy', () => {
  it('elides "de" before a vowel or h, as French requires', () => {
    expect(de('Amina')).toBe("d'Amina");
    expect(de('Hervé')).toBe("d'Hervé");
    expect(de('Émile')).toBe("d'Émile");
    expect(de('Kofi')).toBe('de Kofi');
  });

  it('has the same keys in English and French', () => {
    expect(Object.keys(copyFor('fr')).sort()).toEqual(Object.keys(copyFor('en')).sort());
  });

  it('falls back to English for an unknown language', () => {
    expect(copyFor('xx')).toBe(copyFor('en'));
  });

  it('names the child instead of using a pronoun', () => {
    const text = copyFor('en').store('Amina').join(' ');
    expect(text).toContain('What Amina does');
    expect(text).not.toMatch(/\b(she|he|her|his)\b/i);
  });

  it('carries a version that fits the database column', () => {
    expect(CONSENT_VERSION.length).toBeGreaterThan(0);
    expect(CONSENT_VERSION.length).toBeLessThanOrEqual(20);
  });
});
```

`src/lib/dataRights.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('./supabase', () => ({ supabase: { rpc: (...a) => rpc(...a) } }));

const { deleteChildData, stopSchoolSharing, giveSchoolConsent } = await import('./dataRights');

beforeEach(() => rpc.mockReset());

describe('dataRights', () => {
  it('deleting a child withdraws progress_sync for that child', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await deleteChildData('s1');
    expect(rpc).toHaveBeenCalledWith('withdraw_consent',
      { p_student_id: 's1', p_purpose: 'progress_sync' });
  });

  it('stopping school sharing withdraws school_share only', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await stopSchoolSharing('s1');
    expect(rpc).toHaveBeenCalledWith('withdraw_consent',
      { p_student_id: 's1', p_purpose: 'school_share' });
  });

  it('school consent is recorded with the current wording version', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await giveSchoolConsent('s1');
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_purpose: 'school_share' });
    expect(rpc.mock.calls[0][1].p_version).toBeTruthy();
  });

  it('a server error is thrown, never swallowed', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'nope' } });
    await expect(deleteChildData('s1')).rejects.toBeTruthy();
  });
});
```

Append to `src/store.test.js` (inside the top-level `describe`, or as a new one; import `forgetServerLink` and `linkChild` alongside the existing imports):

```js
describe('consent gate', () => {
  it('a fresh state has no consent', () => {
    expect(defaultState().consent).toBeNull();
  });

  it('linkChild does nothing without the child\'s OK', async () => {
    const s = { ...defaultState(), user: { name: 'Amina', avatar: 'lion' },
                consent: { version: '2026-09-29', childAssent: false } };
    expect(await linkChild(s)).toBe(s);
  });

  it('forgetting the server link keeps the stars', () => {
    const s = { ...defaultState(), studentId: 's1', deviceToken: 't',
                outbox: [{ id: 'e' }], consent: { version: 'v', childAssent: true },
                onboardedAt: 'x',
                progress: { ...defaultState().progress, stars: 12 } };
    const f = forgetServerLink(s);
    expect(f.studentId).toBeNull();
    expect(f.deviceToken).toBeNull();
    expect(f.outbox).toEqual([]);
    expect(f.consent).toBeNull();
    expect(f.onboardedAt).toBeNull();
    expect(f.progress.stars).toBe(12);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run 2>&1 | tail -15`
Expected: FAIL: cannot resolve `./consentCopy`, `./dataRights`; `forgetServerLink is not a function`.

- [ ] **Step 3: Implement `src/consentCopy.js`**

```js
/**
 * The exact words a parent and a child agree to.
 *
 * CONSENT_VERSION is stored with every consent row. Change it whenever any
 * wording below changes: a record must always point at the words that person
 * actually saw, and git keeps each version recoverable.
 *
 * No pronouns for the child. Gender is asked AFTER consent, so the copy repeats
 * the name instead of guessing.
 */
export const CONSENT_VERSION = '2026-09-29';

/** French elision: "d'Amina", "d'Hervé", "de Kofi". */
export const de = (name) =>
  (/^[aeiouyhàâäéèêëîïôöûùü]/iu.test(name) ? `d'${name}` : `de ${name}`);

const en = {
  title: 'Before we save anything',
  intro: (n) => `To show you ${n}'s progress on your account, we need to store some of it on our server. Here is exactly what that means.`,
  storeTitle: 'What we store',
  store: (n) => [
    `${n}'s first name and avatar`,
    `What ${n} does in the app: words spelled, sounds practised, stars earned`,
    'Your email, which you used to sign in',
  ],
  neverTitle: 'What we never do',
  never: [
    'Sell it, or use it for advertising',
    'Show it to other parents',
    'Show it to a school, unless you choose that yourself on the next screen',
    'Ask for your home address',
  ],
  whereTitle: 'Where it is kept:',
  where: 'on Supabase servers in Ireland (European Union). Only your account can read it.',
  controlTitle: 'You stay in control:',
  control: (n) => `you can delete all of it at any time from the Parents page. ${n}'s stars stay on this phone.`,
  noTitle: 'If you say no:',
  no: (n) => `${n} keeps using everything on this phone, even offline. Only the Parents page needs this.`,
  checkbox: (n) => `I am ${n}'s parent or legal guardian, and I agree to LexiaCamer storing the information above.`,
  agree: 'Agree and continue',
  notNow: 'Not now',
  handPhone: (n) => `Hand the phone to ${n}`,
  childAsk: 'Your grown-up wants to see your stars and the words you learn. Is that OK with you?',
  childYes: 'Yes!',
  childNo: 'No thanks',
  childSaidNo: (n) => `${n} said not yet. Nothing has been saved.`,
  askAgain: 'Ask again',
  schoolBox: (n) => `Let ${n}'s school see ${n}'s progress once the school joins LexiaCamer: only ${n}'s teachers and head teacher. You can turn this off at any time.`,
  dataTitle: 'Your data',
  download: (n) => `Download a copy of ${n}'s data`,
  stopSchool: (n) => `Stop sharing with ${n}'s school`,
  stopSchoolDone: 'Done. The school can no longer see this.',
  delete: (n) => `Delete ${n}'s data from LexiaCamer`,
  deleteConfirm: (n) => `This deletes ${n}'s name and learning history from our server. It cannot be undone. ${n}'s stars stay on this phone.`,
  deleteAccountToo: 'Also delete my account and my email',
  confirmDelete: 'Delete',
  cancel: 'Cancel',
  needInternet: 'You need internet to do this.',
  failed: 'That did not work. Check your connection and try again.',
  eraseNeedsInternet: 'This phone is linked to your account. Connect to the internet so the server copy is deleted too.',
};

const fr = {
  title: "Avant d'enregistrer quoi que ce soit",
  intro: (n) => `Pour vous montrer les progrès ${de(n)} sur votre compte, nous devons en conserver une partie sur notre serveur. Voici exactement ce que cela signifie.`,
  storeTitle: 'Ce que nous conservons',
  store: (n) => [
    `Le prénom et l'avatar ${de(n)}`,
    `Ce que ${n} fait dans l'application : mots épelés, sons pratiqués, étoiles gagnées`,
    'Votre adresse e-mail, utilisée pour vous connecter',
  ],
  neverTitle: 'Ce que nous ne faisons jamais',
  never: [
    'Vendre ces informations ou les utiliser pour de la publicité',
    "Les montrer à d'autres parents",
    "Les montrer à une école, sauf si vous le choisissez vous-même à l'écran suivant",
    "Vous demander l'adresse de votre domicile",
  ],
  whereTitle: 'Où elles sont conservées :',
  where: 'sur les serveurs de Supabase en Irlande (Union européenne). Seul votre compte peut les lire.',
  controlTitle: 'Vous gardez le contrôle :',
  control: (n) => `vous pouvez tout supprimer à tout moment depuis la page Parents. Les étoiles ${de(n)} restent sur ce téléphone.`,
  noTitle: 'Si vous refusez :',
  no: (n) => `${n} continue d'utiliser toute l'application sur ce téléphone, même hors ligne. Seule la page Parents en a besoin.`,
  checkbox: (n) => `Je suis le parent ou le tuteur légal ${de(n)}, et j'accepte que LexiaCamer conserve les informations ci-dessus.`,
  agree: 'Accepter et continuer',
  notNow: 'Pas maintenant',
  handPhone: (n) => `Donnez le téléphone à ${n}`,
  childAsk: "Ton parent aimerait voir tes étoiles et les mots que tu apprends. Tu es d'accord ?",
  childYes: 'Oui !',
  childNo: 'Non merci',
  childSaidNo: (n) => `${n} a dit pas encore. Rien n'a été enregistré.`,
  askAgain: 'Demander à nouveau',
  schoolBox: (n) => `Autoriser l'école ${de(n)} à voir ses progrès une fois que l'école aura rejoint LexiaCamer : seulement ses enseignants et le directeur. Vous pouvez désactiver cela à tout moment.`,
  dataTitle: 'Vos données',
  download: (n) => `Télécharger une copie des données ${de(n)}`,
  stopSchool: (n) => `Arrêter le partage avec l'école ${de(n)}`,
  stopSchoolDone: "C'est fait. L'école ne peut plus voir ces informations.",
  delete: (n) => `Supprimer les données ${de(n)} de LexiaCamer`,
  deleteConfirm: (n) => `Cela supprime le nom ${de(n)} et son historique d'apprentissage de notre serveur. C'est définitif. Les étoiles ${de(n)} restent sur ce téléphone.`,
  deleteAccountToo: 'Supprimer aussi mon compte et mon e-mail',
  confirmDelete: 'Supprimer',
  cancel: 'Annuler',
  needInternet: 'Il faut une connexion internet pour faire cela.',
  failed: "Cela n'a pas fonctionné. Vérifiez votre connexion et réessayez.",
  eraseNeedsInternet: 'Ce téléphone est relié à votre compte. Connectez-vous à internet pour que la copie sur le serveur soit aussi supprimée.',
};

const copies = { en, fr };
export const copyFor = (lang) => copies[lang] || copies.en;
```

- [ ] **Step 4: Implement `src/lib/dataRights.js`**

```js
/**
 * What a parent can do with their child's server data. Every call throws on
 * failure: a parent who pressed "delete" must never be told it worked when it
 * did not.
 */
import { supabase } from './supabase';
import { CONSENT_VERSION } from '../consentCopy';

async function call(fn, args) {
  if (!supabase) throw new Error('no backend');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

export const exportChild = (studentId) =>
  call('export_student', { p_student_id: studentId });

export const giveSchoolConsent = (studentId) =>
  call('give_consent', {
    p_student_id: studentId, p_purpose: 'school_share', p_version: CONSENT_VERSION,
  });

export const stopSchoolSharing = (studentId) =>
  call('withdraw_consent', { p_student_id: studentId, p_purpose: 'school_share' });

export const deleteChildData = (studentId) =>
  call('withdraw_consent', { p_student_id: studentId, p_purpose: 'progress_sync' });

export const deleteMyAccount = () => call('delete_my_account', {});

export async function hasSchoolSharing(studentId) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('consents')
    .select('id')
    .eq('student_id', studentId)
    .eq('purpose', 'school_share')
    .is('withdrawn_at', null)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}
```

- [ ] **Step 5: Update `src/store.js`**

In `defaultState()`, add after `onboardedAt: null,`:

```js
    // The parent's consent and the child's own OK, for THIS phone's child.
    // Null until asked. Nothing is linked to the server until childAssent is
    // true; the server refuses too (0021), this just avoids the round trip.
    consent: null,
```

In `linkChild`, make this the FIRST line of the function body, so the gate holds whatever the backend configuration:

```js
  // No child is created on the server without the parent's consent AND the
  // child's own OK (Cameroon Law 2024/017; enforced again in create_student).
  if (!state.consent?.childAssent) return state;
```

and change the `create_student` call to:

```js
      const { data, error } = await supabase.rpc('create_student', {
        p_name: state.user.name,
        p_avatar: state.user.avatar || 'lion',
        p_consent_version: state.consent.version,
        p_child_assent: true,
      });
```

Add after `linkChild`:

```js
/**
 * Drop everything that ties this phone to a server record, after the parent
 * deleted it. The child's stars and history on the phone stay: deleting the
 * server copy must never look like punishing the child.
 */
export function forgetServerLink(state) {
  return {
    ...state,
    studentId: null,
    deviceToken: null,
    outbox: [],
    lastSyncedAt: null,
    onboardedAt: null,
    consent: null,
  };
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `npx vitest run 2>&1 | grep -E "Tests|FAIL"` and `npm run lint 2>&1 | tail -2`
Expected: all tests pass; lint 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/consentCopy.js src/consentCopy.test.js src/lib/dataRights.js src/lib/dataRights.test.js src/store.js src/store.test.js
git commit -m "feat(app): consent wording, data-rights calls, and no linking without consent

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The consent screens, wired into the Parents page

**Files:**
- Create: `src/auth/ParentConsent.jsx`, `src/auth/ParentConsent.test.jsx`
- Modify: `src/App.jsx` (import, linking effect gate, `needsConsent`, route)
- Modify: `src/index.css` (append consent styles)

**Interfaces:**
- Consumes: `copyFor`, `CONSENT_VERSION` (Task 4); `state.consent` (Task 4).
- Produces: `<ParentConsent lang childName childDeclined onAgree={(childAssent: boolean) => void} onBack />`.

- [ ] **Step 1: Write the failing test**

`src/auth/ParentConsent.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ParentConsent from './ParentConsent';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host, root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (props) => act(() => root.render(
  <ParentConsent lang="en" childName="Amina" childDeclined={false}
                 onAgree={() => {}} onBack={() => {}} {...props} />));
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const click = (el) => act(() => el.click());

describe('ParentConsent', () => {
  it('cannot agree until the box is ticked', () => {
    render();
    expect(button('Agree and continue').disabled).toBe(true);
    click(host.querySelector('input[type="checkbox"]'));
    expect(button('Agree and continue').disabled).toBe(false);
  });

  it('asks the child after the parent agrees, and records their yes', () => {
    const onAgree = vi.fn();
    render({ onAgree });
    click(host.querySelector('input[type="checkbox"]'));
    click(button('Agree and continue'));
    expect(onAgree).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Hand the phone to Amina');
    click(button('Yes!'));
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onAgree).toHaveBeenCalledWith(true);
  });

  it('records the child\'s no as a no', () => {
    const onAgree = vi.fn();
    render({ onAgree });
    click(host.querySelector('input[type="checkbox"]'));
    click(button('Agree and continue'));
    click(button('No thanks'));
    expect(onAgree).toHaveBeenCalledWith(false);
    expect(host.textContent).toContain('Amina said not yet');
  });

  it('"Not now" sends nothing', () => {
    const onAgree = vi.fn(); const onBack = vi.fn();
    render({ onAgree, onBack });
    click(button('Not now'));
    expect(onBack).toHaveBeenCalled();
    expect(onAgree).not.toHaveBeenCalled();
  });

  it('after a child\'s no, the parent can ask again', () => {
    render({ childDeclined: true });
    expect(host.textContent).toContain('Amina said not yet');
    click(button('Ask again'));
    expect(host.textContent).toContain('Is that OK with you?');
  });

  it('speaks French with correct elision', () => {
    render({ lang: 'fr' });
    expect(host.textContent).toContain("tuteur légal d'Amina");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/auth/ParentConsent.test.jsx 2>&1 | tail -5`
Expected: FAIL: cannot resolve `./ParentConsent`.

- [ ] **Step 3: Implement `src/auth/ParentConsent.jsx`**

```jsx
import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { copyFor } from '../consentCopy';

/**
 * Consent before a child's data leaves the phone, in two parts:
 *
 *   1. The parent reads what is stored, where, and how to undo it, and ticks
 *      an unticked box. "Not now" costs nothing: the child keeps the app.
 *   2. The child is asked in their own words. The law wants a minor's OK in
 *      addition to the parent's, and a child who says no is not overruled.
 *
 * Nothing is sent from here. onAgree(true) lets App link the child, and the
 * server records the consent in the same transaction that creates the child.
 */
export default function ParentConsent({ lang, childName, childDeclined, onAgree, onBack }) {
  const c = copyFor(lang);
  const n = childName || (lang === 'fr' ? 'votre enfant' : 'your child');
  const [step, setStep] = useState(childDeclined ? 'declined' : 'parent');
  const [ticked, setTicked] = useState(false);

  return (
    <div className="screen">
      <div className="focus-back">
        <button className="btn btn-ghost p-2" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="auth-card consent-card">
        {step === 'parent' && (
          <>
            <h2 className="onb-title">{c.title}</h2>
            <p className="onb-sub">{c.intro(n)}</p>

            <h3 className="consent-h">{c.storeTitle}</h3>
            <ul className="consent-list">{c.store(n).map((s) => <li key={s}>{s}</li>)}</ul>

            <h3 className="consent-h">{c.neverTitle}</h3>
            <ul className="consent-list">{c.never.map((s) => <li key={s}>{s}</li>)}</ul>

            <p className="consent-p"><strong>{c.whereTitle}</strong> {c.where}</p>
            <p className="consent-p"><strong>{c.controlTitle}</strong> {c.control(n)}</p>
            <p className="consent-p"><strong>{c.noTitle}</strong> {c.no(n)}</p>

            <label className="consent-check">
              <input type="checkbox" checked={ticked}
                     onChange={(e) => setTicked(e.target.checked)} />
              <span>{c.checkbox(n)}</span>
            </label>

            <div className="onb-actions">
              <button type="button" className="btn btn-ghost" onClick={onBack}>{c.notNow}</button>
              <button type="button" className="btn btn-primary" disabled={!ticked}
                      onClick={() => setStep('child')}>
                <ShieldCheck size={18} /> {c.agree}
              </button>
            </div>
          </>
        )}

        {step === 'child' && (
          <>
            <p className="consent-hand">{c.handPhone(n)}</p>
            <h2 className="onb-title consent-child-ask">{c.childAsk}</h2>
            <div className="onb-actions">
              {/* App keeps this screen mounted after a no, so switch the step
                  here: the childDeclined prop only sets the FIRST step. */}
              <button type="button" className="btn btn-ghost"
                      onClick={() => { setStep('declined'); onAgree(false); }}>
                {c.childNo}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onAgree(true)}>
                {c.childYes}
              </button>
            </div>
          </>
        )}

        {step === 'declined' && (
          <>
            <p className="onb-sub">{c.childSaidNo(n)}</p>
            <div className="onb-actions">
              <button type="button" className="btn btn-ghost" onClick={onBack}>{c.notNow}</button>
              <button type="button" className="btn btn-primary" onClick={() => setStep('child')}>
                {c.askAgain}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire it into `src/App.jsx`**

Imports:

```jsx
import ParentConsent from './auth/ParentConsent';
import { CONSENT_VERSION } from './consentCopy';
```

In the linking effect, change the first line and the dependency list:

```jsx
    if (!auth.session || isOffline || !state.consent?.childAssent) return;
    ...
  }, [auth.session, isOffline, state.consent?.childAssent]);
```

Next to `needsParentOnboarding`, add, and include it in `isFocusedFlow`:

```jsx
  const needsConsent =
    screen === 'parent_dashboard' && Boolean(auth.session) && !school.isSchoolUser
    && !state.consent?.childAssent;
  const isFocusedFlow = screen === 'onboarding' || needsSignIn || needsConsent
    || needsParentOnboarding || Boolean(inviteToken);
```

In the `'parent_dashboard'` case, after the `school.isSchoolUser` block and before the `ParentOnboarding` block:

```jsx
        // Nothing about the child goes to the server until the parent has
        // agreed and the child has said yes. Saying no keeps the whole app.
        if (auth.session && !state.consent?.childAssent) {
          return (
            <ParentConsent
              lang={lang}
              childName={user.name}
              childDeclined={state.consent?.childAssent === false}
              onAgree={(childAssent) => setState(s2 => ({
                ...s2, consent: { version: CONSENT_VERSION, childAssent },
              }))}
              onBack={() => setScreen('home')}
            />
          );
        }
```

- [ ] **Step 5: Append styles to `src/index.css`**

```css
/* --- Consent --- */
.consent-card { text-align: left; }
.consent-h { font-size: 1rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
.consent-list { margin: 0; padding-left: 1.25rem; line-height: 1.6; }
.consent-list li { margin-bottom: 0.25rem; }
.consent-p { margin: 0.75rem 0 0; line-height: 1.6; }
.consent-check {
  display: flex; gap: 0.75rem; align-items: flex-start;
  margin-top: 1.5rem; padding: 1rem;
  border: 2px solid var(--border-medium); border-radius: var(--radius-lg);
  line-height: 1.5; cursor: pointer;
}
.consent-check input { width: 1.4rem; height: 1.4rem; flex-shrink: 0; margin-top: 0.1rem; }
.consent-hand { font-style: italic; color: var(--text-secondary); text-align: center; }
.consent-child-ask { text-align: center; font-size: 1.5rem; line-height: 1.4; }
```

- [ ] **Step 6: Run to verify**

Run: `npx vitest run 2>&1 | grep -E "Tests|FAIL"`, `npm run lint 2>&1 | tail -2`, `npm run build 2>&1 | grep -E "built|rror"`
Expected: all pass, 0 lint errors, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/auth/ParentConsent.jsx src/auth/ParentConsent.test.jsx src/App.jsx src/index.css
git commit -m "feat(app): ask the parent, then the child, before anything is saved

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Onboarding asks less, and asks before sharing with a school

**Files:**
- Modify: `src/auth/ParentOnboarding.jsx`
- Modify: `src/App.jsx` (pass `lang`)

**Interfaces:**
- Consumes: `giveSchoolConsent(studentId)` (Task 4), `copyFor` (Task 4).
- Produces: `<ParentOnboarding lang studentId initialChildName onBack onDone />`.

- [ ] **Step 1: Remove the address step**

In `ParentOnboarding.jsx`:
- Delete the step-3 state (`line1`, `neighbourhood`, `city`, `region`), `saveAddress`, and the whole `{step === 3 && (...)}` block.
- In `saveParent`, replace `setStep(3);` with `onDone();`.
- Step dots: `[1, 2].map(...)` and `aria-label={`Step ${step} of 2`}`.
- Replace the header comment's list with:

```js
 *   1. The child   name, birth date, gender; and, only if the parent ticks the
 *                  box, which school may see their progress.
 *   2. The parent  name and phone.
 *
 * There is no address step. A reading app has no use for a home address, and
 * the landing page promises we never ask for one. (0021 also drops the write
 * policies on guardian_addresses, so no old copy of the app can store one.)
```

- [ ] **Step 2: Add the school box**

Imports and props:

```jsx
import { copyFor } from '../consentCopy';
import { giveSchoolConsent } from '../lib/dataRights';

export default function ParentOnboarding({ lang, studentId, initialChildName, onBack, onDone }) {
  const c = copyFor(lang);
  const [shareWithSchool, setShareWithSchool] = useState(false);
```

Wrap the existing school label, picked-school card and search block (everything from the school `<label htmlFor="onb-school">` to the end of the search results) in:

```jsx
            <label className="consent-check">
              <input type="checkbox" checked={shareWithSchool}
                     onChange={(e) => {
                       setShareWithSchool(e.target.checked);
                       if (!e.target.checked) { setSchool(null); setClasses([]); setClassId(''); }
                     }} />
              <span>{c.schoolBox(childName.trim() || initialChildName || '')}</span>
            </label>

            {shareWithSchool && (
              <>
                {/* existing school picker markup, unchanged */}
              </>
            )}
```

In `saveChild`, gate the school calls and give consent first:

```jsx
      if (shareWithSchool && school) {
        await giveSchoolConsent(studentId);
        if (!school.on_platform && school.directory_id) {
          await supabase.rpc('note_school_interest', {
            p_directory_id: school.directory_id,
            p_student_id: studentId,
          });
        }
        if (classId) {
          const { error: err } = await supabase.rpc('claim_school_place', {
            p_student_id: studentId,
            p_class_id: classId,
          });
          if (err && !String(err.message || '').includes('already has an active')) {
            throw err;
          }
        }
      }
```

Replace the step subtitles so they are true when nothing is shared:
- step 1: `<p className="onb-sub">Only you can see this, unless you choose to share with a school below.</p>`
- step 2: `<p className="onb-sub">If you share with a school, their teacher sees your name and phone number, nothing else.</p>`

- [ ] **Step 3: Pass `lang` from `App.jsx`**

```jsx
            <ParentOnboarding
              lang={lang}
              studentId={state.studentId}
```

- [ ] **Step 4: Verify**

Run: `npm run lint 2>&1 | tail -2`, `npx vitest run 2>&1 | grep Tests`, `npm run build 2>&1 | grep -E "built|rror"`, and `grep -n "guardian_addresses\|saveAddress" src/auth/ParentOnboarding.jsx`
Expected: 0 lint errors, tests pass, build ok, grep prints nothing.

- [ ] **Step 5: Commit**

```bash
git add src/auth/ParentOnboarding.jsx src/App.jsx
git commit -m "feat(app): no home address, and school sharing only if the parent ticks it

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: "Your data" on the Parents page, and erase-when-linked

**Files:**
- Create: `src/auth/YourData.jsx`
- Modify: `src/ParentDashboard.jsx` (render a `yourData` slot)
- Modify: `src/App.jsx` (build the slot; `handleEraseChild` deletes the server copy when linked)
- Modify: `src/store.test.js` (append)

**Interfaces:**
- Consumes: `exportChild`, `stopSchoolSharing`, `deleteChildData`, `deleteMyAccount`, `hasSchoolSharing` (Task 4); `forgetServerLink` (Task 4); `auth.signOut()` from `useAuth()`.
- Produces: `<YourData lang studentId childName isOffline onChildDeleted onAccountDeleted />`; `<ParentDashboard ... yourData={node} />`.

- [ ] **Step 1: Write the failing test (Review Focus 1)**

Add `eraseChild` to `src/store.js`'s exports in Step 3; append to `src/store.test.js`:

```js
describe('erasing a linked child', () => {
  it('deletes the server copy before resetting the phone', async () => {
    const calls = [];
    const s = { ...defaultState(), studentId: 's1', consent: { version: 'v', childAssent: true } };
    const next = await eraseChild(s, { online: true, deleteServer: async (id) => calls.push(id) });
    expect(calls).toEqual(['s1']);
    expect(next.studentId).toBeNull();
  });

  it('refuses offline rather than stranding the server copy', async () => {
    const s = { ...defaultState(), studentId: 's1' };
    await expect(eraseChild(s, { online: false, deleteServer: async () => {} }))
      .rejects.toThrow('offline');
  });

  it('an unlinked phone erases without the network', async () => {
    const s = { ...defaultState(), user: { name: 'Amina', avatar: 'lion' } };
    const next = await eraseChild(s, { online: false, deleteServer: async () => { throw new Error('no'); } });
    expect(next.user.name).toBe('');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/store.test.js 2>&1 | tail -5`
Expected: FAIL: `eraseChild is not a function`.

- [ ] **Step 3: Implement `eraseChild` in `src/store.js`**

```js
/**
 * Erase this phone's child. When the phone is linked, the server copy goes
 * first: resetting only the phone would strand a record the parent can no
 * longer reach from here. Keeps language and settings, like before.
 */
export async function eraseChild(state, { online, deleteServer }) {
  if (state.studentId) {
    if (!online) throw new Error('offline');
    await deleteServer(state.studentId);
  }
  return { ...defaultState(), lang: state.lang, settings: state.settings };
}
```

- [ ] **Step 4: Implement `src/auth/YourData.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import { Download, Trash2, School } from 'lucide-react';
import { copyFor } from '../consentCopy';
import {
  exportChild, stopSchoolSharing, deleteChildData, deleteMyAccount, hasSchoolSharing,
} from '../lib/dataRights';

/**
 * A parent's rights over the server copy, on the page they already use.
 * Every action needs the network and says so, rather than failing silently.
 */
export default function YourData({ lang, studentId, childName, isOffline, onChildDeleted, onAccountDeleted }) {
  const c = copyFor(lang);
  const n = childName || (lang === 'fr' ? 'votre enfant' : 'your child');
  const [sharing, setSharing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [alsoAccount, setAlsoAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!studentId || isOffline) return undefined;
    let off = false;
    hasSchoolSharing(studentId).then((v) => { if (!off) setSharing(v); }).catch(() => {});
    return () => { off = true; };
  }, [studentId, isOffline]);

  if (!studentId) return null;

  const run = async (fn) => {
    if (isOffline) { setMessage(c.needInternet); return; }
    setBusy(true);
    setMessage('');
    try { await fn(); } catch { setMessage(c.failed); } finally { setBusy(false); }
  };

  const download = () => run(async () => {
    const data = await exportChild(studentId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexiacamer-${n.replace(/[^\p{L}\p{N}_-]+/gu, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const stopSharing = () => run(async () => {
    await stopSchoolSharing(studentId);
    setSharing(false);
    setMessage(c.stopSchoolDone);
  });

  const remove = () => run(async () => {
    await deleteChildData(studentId);
    if (alsoAccount) {
      await deleteMyAccount();
      onAccountDeleted();
    } else {
      onChildDeleted();
    }
  });

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3 className="consent-h" style={{ marginTop: 0 }}>{c.dataTitle}</h3>

      <button type="button" className="btn btn-ghost your-data-btn" onClick={download} disabled={busy}>
        <Download size={18} /> {c.download(n)}
      </button>

      {sharing && (
        <button type="button" className="btn btn-ghost your-data-btn" onClick={stopSharing} disabled={busy}>
          <School size={18} /> {c.stopSchool(n)}
        </button>
      )}

      {!confirming ? (
        <button type="button" className="btn btn-ghost your-data-btn your-data-danger"
                onClick={() => setConfirming(true)} disabled={busy}>
          <Trash2 size={18} /> {c.delete(n)}
        </button>
      ) : (
        <div className="your-data-confirm">
          <p className="consent-p">{c.deleteConfirm(n)}</p>
          <label className="consent-check">
            <input type="checkbox" checked={alsoAccount}
                   onChange={(e) => setAlsoAccount(e.target.checked)} />
            <span>{c.deleteAccountToo}</span>
          </label>
          <div className="onb-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>
              {c.cancel}
            </button>
            <button type="button" className="btn your-data-danger-solid" onClick={remove} disabled={busy}>
              {c.confirmDelete}
            </button>
          </div>
        </div>
      )}

      {message && <p role="status" className="consent-p">{message}</p>}
    </div>
  );
}
```

Append to `src/index.css`:

```css
.your-data-btn { width: 100%; justify-content: flex-start; gap: 0.5rem; margin-top: 0.5rem; }
.your-data-danger { color: var(--rose-600); }
.your-data-danger-solid { background: var(--rose-600); color: #fff; }
.your-data-confirm { margin-top: 1rem; }
```

- [ ] **Step 5: Render the slot and wire App**

`src/ParentDashboard.jsx`: add `yourData` to the props and render `{yourData}` as the last child of the outermost `<div>`, after the reset card.

`src/App.jsx`:

```jsx
import YourData from './auth/YourData';
import { deleteChildData } from './lib/dataRights';
// add forgetServerLink and eraseChild to the './store' import
```

Replace `handleEraseChild`:

```jsx
  const handleEraseChild = useCallback(async () => {
    try {
      const next = await eraseChild(stateRef.current, {
        online: !isOffline,
        deleteServer: deleteChildData,
      });
      setState(next);
      setScreen('onboarding');
    } catch {
      window.alert(copyFor(lang).eraseNeedsInternet);
    }
  }, [isOffline, lang]);
```

(import `copyFor` alongside `CONSENT_VERSION`.) The `alert` is deliberate: the reset card has no message slot, and silently not erasing is worse.

Pass the slot:

```jsx
        return (
          <ParentDashboard
            t={t} stats={stats} missedPhonemes={missedPhonemes}
            onResetProgress={handleEraseChild} onBack={() => setScreen('home')}
            yourData={
              <YourData
                lang={lang}
                studentId={state.studentId}
                childName={user.name}
                isOffline={isOffline}
                onChildDeleted={() => setState(s2 => forgetServerLink(s2))}
                onAccountDeleted={async () => {
                  setState(s2 => forgetServerLink(s2));
                  await auth.signOut();
                  setScreen('home');
                }}
              />
            }
          />
        );
```

- [ ] **Step 6: Verify**

Run: `npx vitest run 2>&1 | grep -E "Tests|FAIL"`, `npm run lint 2>&1 | tail -2`, `npm run build 2>&1 | grep -E "built|rror"`
Expected: all pass, 0 errors, build ok.

- [ ] **Step 7: Commit**

```bash
git add src/auth/YourData.jsx src/ParentDashboard.jsx src/App.jsx src/store.js src/store.test.js src/index.css
git commit -m "feat(app): download, stop sharing, delete, and delete account

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Browser check, rollout, and project notes

**Files:**
- Modify: `.ai/DATA_MODEL.md`, `.ai/SECURITY.md`, `.ai/THREAT_MODEL.md`, `.ai/API_INVENTORY.md` (local only, gitignored: never `git add -f`)

- [ ] **Step 1: Browser QA without a backend** (`/browse`, dev server)

With no `VITE_SUPABASE_*` in the environment, confirm the kids' app is unchanged: onboarding, home, Phonics Lab, Word Forge, no console errors.

- [ ] **Step 2: Browser QA of the consent flow against a Vercel preview**

Needs the migration applied (Step 4), so run after it. With a test email, in EN then FR:
- Parents → sign in → consent screen; "Agree" disabled until ticked; "Not now" returns home.
- Agree → "Hand the phone" → "No thanks" → "said not yet" → "Ask again" → "Yes!" → onboarding (2 steps, no address).
- School box off: no picker. On: picker appears.
- Your data: download works; stop sharing (if shared); delete with "also delete my account" ticked → signed out, kids' stars still on the phone.
- In the Supabase SQL editor, confirm the test child and account are gone and the consent rows show `withdrawn_at`.
- Review Focus 3: delete the account from one browser while another is linked; the second keeps working offline, no error loop in the console.

- [ ] **Step 3: Pre-flight on the live DB** (owner runs, in the Supabase SQL editor)

```sql
select count(*) from students;            -- expect 0
select count(*) from guardian_addresses;  -- if > 0, ask the owner before continuing
```

- [ ] **Step 4: Apply the migration** (owner runs; password never on the command line)

```bash
read -rsp "DB password: " PGPASSWORD; export PGPASSWORD; echo
./supabase/apply.sh "postgresql://postgres.adjqczmicaqziuetwtfc@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
unset PGPASSWORD
```

Expected: `apply 0021_consents.sql`, `1 migration(s) applied.`, every table `RLS on` including `consents`.

- [ ] **Step 5: French review**

A native French speaker reads every `fr` string in `src/consentCopy.js`. Any wording change bumps `CONSENT_VERSION` (and the spec's version note).

- [ ] **Step 6: Push (deploys production)**

Only after Steps 3–5: `git push origin early-testers`.

- [ ] **Step 7: Update the local project notes**

- `DATA_MODEL.md`: add `consents` (fields as in Task 1), note `students`/`activity_events`/`progress` now hold children's data server-side behind consent, `guardian_addresses` no longer written.
- `SECURITY.md`: under-18 consent is now implemented (0021; link the spec); cross-border authorisation still open.
- `THREAT_MODEL.md`: add asset "children's learning records (server-side, consented)" with attackers: stranger reading another child (RLS + tests C07–C11), old cached app bypassing consent (refused by `create_student`, test C03).
- `API_INVENTORY.md`: add `create_student` (4 args), `give_consent`, `withdraw_consent`, `delete_my_account`.
- Tell the owner: `CLAUDE.md` says re-assess risk to HIGH now. Their decision.
