# Parental consent before a child's data leaves the phone

Status: design approved in conversation 2026-09-29, spec awaiting review.
Branch: `early-testers` (production since 2026-09-28).

## Why

Since `early-testers` went to production, a parent who signs in has their child
created on the server straight away (name, avatar, then every learning event),
before any consent. Onboarding then asks for birth date, gender, school, parent
name, phone and an optional home address. Nothing records parental consent, and
there is no way in the app to withdraw.

Cameroon Law 2024/017 (see `.ai/DOMAIN_KNOWLEDGE.md`) requires consent that is
express, specific to each purpose, given before processing, and, for under-18s,
given by a parent **in addition to** the child. `.ai/SECURITY.md` lists this as
a hard blocker for storing child records server-side.

Checked 2026-09-29: `select count(*) from students` on the live DB returned 0.
No child data went up without consent, so nothing needs a backfill.

## Goals

- No child is created on the server without recorded parent consent and child
  assent. Enforced by the database, not only by the screen.
- A parent understands exactly what is stored, where, who sees it, and how to
  undo it, in English or French.
- Saying no costs nothing: the child keeps the full app offline.
- A parent can download, stop school sharing, delete the child's data, and
  delete their own account, from the app.
- Collect less: stop asking for a home address.

## Non-goals

- Translating the rest of the sign-in and onboarding screens (listed under
  open items).
- Cross-border transfer authorisation (owner decision, open item).
- Changing the risk level (owner decision, open item).

## Change from the conversation: consent is per child, not per parent

Section 1 as approved said "one consent per parent, covering their child". That
breaks on a second phone: the app creates one child per phone, and the wording
names the child ("Amina"), so a consent given for Amina cannot cover Kofi on
another phone. Consent therefore belongs to a **child**, and it is recorded in
the **same transaction** that creates the child, so neither can exist without
the other.

## 1. Database: migration `0021_consents.sql`

### Table `consents`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | `gen_random_uuid()` |
| `profile_id` | uuid → `profiles(id)` **on delete set null** | the parent. Null only after the account is deleted |
| `student_id` | uuid → `students(id)` **on delete set null** | the child. Null after the child is deleted |
| `purpose` | text, check in (`progress_sync`, `school_share`) | |
| `wording_version` | text, 1–20 chars, not null | e.g. `2026-09-29`; the exact wording lives in `src/consentCopy.js` at that version, recoverable from git |
| `child_assent_at` | timestamptz | required for `progress_sync`, null for `school_share` |
| `granted_at` | timestamptz not null default now() | |
| `withdrawn_at` | timestamptz | set once, never cleared |

- Partial unique index: one live row per (`student_id`, `purpose`) where
  `withdrawn_at is null`.
- Check: `purpose <> 'progress_sync' or child_assent_at is not null`.
- RLS on. One SELECT policy: `profile_id = auth.uid()`. No INSERT, UPDATE or
  DELETE policy or grant: rows change only through the functions below.
- Rows are never deleted by the app. Withdrawal sets `withdrawn_at`. When the
  child or account is deleted, the FKs null out and what remains is a record
  that a consent existed and was withdrawn, with no child data.

### Functions (all `security definer`, `search_path = public, pg_temp`)

- **`create_student(p_name, p_avatar, p_consent_version, p_child_assent)`**
  replaces the two-argument version (drop it explicitly, or a two-argument call
  would still match the old overload). Refuses with `42501 consent required`
  unless `p_consent_version` is non-empty and `p_child_assent` is true. In one
  transaction: inserts the student, the guardianship, the progress row, and the
  `progress_sync` consent with `child_assent_at = now()`. Old cached apps call
  it with two arguments, get the refusal, and stay offline (their `linkChild`
  already treats an error as "not linked").
- **`give_consent(p_student_id, p_purpose, p_version)`**: only for
  `school_share`. Caller must be a live guardian of the student.
- **`withdraw_consent(p_student_id, p_purpose)`**: caller must be a live
  guardian.
  - `school_share`: sets `withdrawn_at`, sets that child's active enrolments to
    `cancelled` (which already means "no window at all", 0001), and deletes the
    parent's `directory_interest` rows for that child.
  - `progress_sync`: sets `withdrawn_at` on both purposes for that child, then
    runs the existing `delete_student` logic (anonymous billing count kept,
    everything else cascades).
- **`delete_my_account()`**: `delete from auth.users where id = auth.uid()`.
  `profiles` cascades from `auth.users`, guardianships cascade from `profiles`,
  and the existing orphan trigger deletes the child. Consent rows keep their
  dates with both ids nulled.
- **`claim_school_place`** and **`note_school_interest`**: add a check for a
  live `school_share` consent on that student, else `42501`.
- **`guardian_addresses`**: revoke INSERT and UPDATE from `anon` and
  `authenticated`. Keep the table (the paused schools branch shares this DB).
  Before applying, check `select count(*) from guardian_addresses`; if it is
  above 0, ask the owner whether to clear it.

`issue_device_grant` and `sync_activity` need no change: a grant can only be
issued for a child that exists, and a child only exists with consent. Deleting
the child cascades its device grants, so uploads stop.

## 2. Screens and wording

New flow: sign in → **parent consent** → **child assent** → `create_student`
→ onboarding (child details, school, parent name and phone) → dashboard.

`App.jsx`: the effect that calls `linkChild` on sign-in runs only when local
state holds `consent = { version, childAssent: true }` for this device. Until
then the Parents page shows the consent screen. `linkChild` passes the version
and assent to `create_student`.

All copy lives in a new `src/consentCopy.js` with `en` and `fr` keys, one
`CONSENT_VERSION` constant, and the child's name interpolated. The screen uses
the app's current language. No pronouns: gender is asked after consent, so
the copy repeats the child's name instead.

### Parent consent (EN)

> **Before we save anything**
> To show you Amina's progress on your account, we need to store some of it on
> our server. Here is exactly what that means.
>
> **What we store**
> • Amina's first name and avatar
> • What Amina does in the app: words spelled, sounds practised, stars earned
> • Your email, which you used to sign in
>
> **What we never do**
> • Sell it, or use it for advertising
> • Show it to other parents
> • Show it to a school, unless you choose that yourself on the next screen
> • Ask for your home address
>
> **Where it is kept:** on Supabase servers in Ireland (European Union). Only
> your account can read it.
>
> **You stay in control:** you can delete all of it at any time from the
> Parents page. Amina's stars stay on this phone.
>
> **If you say no:** Amina keeps using everything on this phone, even offline.
> Only the Parents page needs this.
>
> ☐ I am Amina's parent or legal guardian, and I agree to LexiaCamer storing
> the information above.
>
> [Agree and continue] (disabled until ticked) · [Not now]

### Parent consent (FR, draft: needs a native speaker's review before release)

> **Avant d'enregistrer quoi que ce soit**
> Pour vous montrer les progrès d'Amina sur votre compte, nous devons en
> conserver une partie sur notre serveur. Voici exactement ce que cela signifie.
>
> **Ce que nous conservons**
> • Le prénom et l'avatar d'Amina
> • Ce qu'Amina fait dans l'application : mots épelés, sons pratiqués, étoiles gagnées
> • Votre adresse e-mail, utilisée pour vous connecter
>
> **Ce que nous ne faisons jamais**
> • Vendre ces informations ou les utiliser pour de la publicité
> • Les montrer à d'autres parents
> • Les montrer à une école, sauf si vous le choisissez vous-même à l'écran suivant
> • Vous demander l'adresse de votre domicile
>
> **Où elles sont conservées :** sur les serveurs de Supabase en Irlande (Union
> européenne). Seul votre compte peut les lire.
>
> **Vous gardez le contrôle :** vous pouvez tout supprimer à tout moment depuis
> la page Parents. Amina garde ses étoiles sur ce téléphone.
>
> **Si vous refusez :** Amina continue d'utiliser toute l'application sur ce
> téléphone, même hors ligne. Seule la page Parents en a besoin.
>
> ☐ Je suis le parent ou le tuteur légal d'Amina, et j'accepte que LexiaCamer
> conserve les informations ci-dessus.
>
> [Accepter et continuer] · [Pas maintenant]

"Not now" returns to the home screen. Nothing is sent.

### Child assent

> *Hand the phone to Amina* / *Donnez le téléphone à Amina*
> **Your grown-up wants to see your stars and the words you learn. Is that OK
> with you?** / **Ton parent aimerait voir tes étoiles et les mots que tu
> apprends. Tu es d'accord ?**
> [Yes!] [No thanks] / [Oui !] [Non merci]

"No thanks": nothing is sent; the Parents page says "Amina said not yet" with a
button to ask again. Nothing is recorded server-side, because nothing was
processed.

### School sharing (onboarding step 1, unticked by default)

> ☐ Let Amina's school see Amina's progress once the school joins LexiaCamer:
> only Amina's teachers and head teacher. You can turn this off at any time.
> ☐ Autoriser l'école d'Amina à voir ses progrès une fois que l'école aura
> rejoint LexiaCamer : seulement ses enseignants et le directeur. Vous pouvez
> désactiver cela à tout moment.

The school picker appears only when ticked. Ticking calls `give_consent` before
`claim_school_place` / `note_school_interest`.

School sharing needs the parent's consent only, no separate child assent
(owner decision, 2026-09-29). The child's assent covers saving progress.

### Address step

Removed from `ParentOnboarding.jsx`. Onboarding becomes two steps.

## 3. "Your data" on the Parents page

Each action shows "You need internet to do this" when offline.

1. **Download a copy of Amina's data**: `export_student`, saved as a readable
   JSON file.
2. **Stop sharing with Amina's school** (only if `school_share` is live):
   `withdraw_consent(student, 'school_share')`.
3. **Delete Amina's data from LexiaCamer**: confirm dialog: "This deletes
   Amina's name and learning history from our server. It cannot be undone.
   Amina's stars stay on this phone." Calls
   `withdraw_consent(student, 'progress_sync')`. The phone then clears
   `studentId`, `deviceToken`, `outbox` and `consent`, keeps `progress`, and
   the Parents page shows the consent screen again.
4. **Delete my account too** (inside the same dialog): `delete_my_account()`,
   then sign out.

## 4. Testing and rollout

### Database: `supabase/tests/13_consent_test.sql`, added to `run.sh`

- `create_student` without version, or without assent: refused.
- With both: child, guardianship, progress and consent rows exist.
- The old two-argument call is refused.
- Parent B cannot read parent A's consents; nobody can INSERT, UPDATE or
  DELETE `consents` directly.
- `claim_school_place` and `note_school_interest` refused without
  `school_share`, allowed with it.
- Withdraw `school_share`: enrolment `cancelled`, school's roster no longer
  shows the child, interest rows gone.
- Withdraw `progress_sync`: student, events, progress and grants gone; billing
  count present; consent row has `withdrawn_at` and a null `student_id`.
- A stranger cannot withdraw someone else's consent.
- `delete_my_account`: auth user, profile and child gone.
- INSERT into `guardian_addresses` refused.

The shim's `auth.users` must support the delete cascade; extend it if not.

### Unit (Vitest)

- `linkChild` is not called while local consent is missing or the child said
  no; is called with version and assent once both are given.
- After delete: link fields cleared, progress kept.

### Browser

The whole flow in EN and FR: consent, Not now, child No thanks, child Yes,
school box on and off, download, stop sharing, delete, delete account. Then one
real run on a Vercel preview against the live DB with a test email, ending with
Delete account.

### Rollout order

1. Check `guardian_addresses` count (see section 1).
2. Apply `0021` to the live DB. From then on the live app cannot create a child
   without consent. The current app keeps working for children; the Parents
   page just stays unlinked.
3. Native-speaker review of the French.
4. Deploy the app.
5. Update `.ai/DATA_MODEL.md`, `SECURITY.md`, `THREAT_MODEL.md` and
   `API_INVENTORY.md`.

The app must not deploy before step 2, or `create_student` would reject its new
arguments.

## Open items (owner decisions, not in this build)

- **Risk level MEDIUM → HIGH**: `CLAUDE.md` says to re-assess before child data
  goes server-side. This feature is that moment.
- **Cross-border transfer**: prior authorisation from Cameroon's data
  protection authority for Supabase (Ireland) and Vercel. Operational status of
  the authority unverified.
- **The rest of sign-in and onboarding are English-only.**
- **No breach-response process** (required "without delay" by the law).
