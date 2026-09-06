# LexiaCamer Standalone Platform — Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Within each task, implement test-first (write the test, watch it fail, make it pass, commit).

**Goal:** Turn LexiaCamer from a local-only prototype into a complete, standalone production platform — own domain, own accounts (email OTP), own backend that stores each child's reading progress, parent/teacher dashboards, offline sync, real phonics audio, and a partner link from Educlynk — built simply, safely, and able to handle heavy traffic without breaking.

**Architecture:** Keep the existing React PWA front end. Add **Supabase** as the backend: managed **Postgres** (data) + **Auth** (email OTP) + **Row-Level Security** (each adult only ever sees their own children, enforced in the database). Host the static PWA on a **CDN** (Cloudflare Pages / Vercel). The app writes progress locally first and syncs to Postgres when online. No servers to run, no clever infrastructure — standard managed pieces that scale on their own.

**Tech Stack:** React 18 + Vite (existing) · Supabase (Postgres 15, GoTrue auth, RLS) · `@supabase/supabase-js` · TanStack Query (data caching) · IndexedDB via `idb-keyval` (offline outbox) · Sentry (error monitoring) · Cloudflare Pages or Vercel (hosting + CDN) · Playwright (e2e) · Vitest (unit).

## Global Constraints

- **Keep it simple.** Prefer managed services and standard patterns over custom infra. No feature a child/parent doesn't need. (See project memory: "keep-it-simple".)
- **Offline-first.** The child experience must work with no network; sync happens in the background.
- **Server is the source of truth for adults.** Kids can't tamper with what parents/teachers see.
- **Security in the database, not just the UI.** Every table has Row-Level Security; the UI is never the only gate.
- **English-first** (French strings already exist in `src/i18n.js`; keep the structure, don't block on translation).
- **One data module.** All reads/writes go through `src/store.js` (already the seam) — swapping or extending the backend is a change in one place.
- **Every task ends green:** builds clean, tests pass, and is independently reviewable.

---

## How to read this plan

The work is grouped into **8 phases**. Each phase is independently shippable — you get a working product after each one, and each could be executed (and reviewed) on its own. Within a phase, each **task** is described with five lenses (as requested):

- **Clarify** — what it does and why, plus any assumption to confirm.
- **Sketch** — the design: files, interfaces, schema, key snippets.
- **Estimate** — rough solo-builder-with-AI effort (S ≈ ½ day, M ≈ 1 day, L ≈ 2–3 days).
- **Failure modes** — what could break in production and the mitigation.
- **Deep dive** — edge cases, error handling, and the test that proves it done.

Do phases in order. Do not start Phase 2 (backend data) before Phase 1 (auth) is green.

---

## A. Architecture decision (Clarify) — read once

**Why Supabase + Postgres (not Firebase, not a hand-rolled server):**
- The data is **relational**: one child has many linked adults; one teacher has many children; progress belongs to a child. Postgres models this with foreign keys, joins, and constraints — correct and simple. Firestore (NoSQL) makes these relationships and the "only my children" security rule awkward.
- **Row-Level Security (RLS)** lets the database itself enforce "an adult can only read/write their own children." That is the strongest, simplest multi-family security model — you cannot accidentally leak another family's data from the UI.
- Supabase runs the Postgres, the **email-OTP auth**, connection pooling, backups, and scaling. You do **not** run servers. That is the "heavy traffic without breaking / minimal complexity" requirement, met by managed infrastructure.
- The static PWA on a **CDN** scales to any number of users for the app itself (it's just files). The only thing that scales with users is the database, and per-child data is tiny (one row), so reads are cheap indexed lookups.

**Assumptions to confirm (won't block the plan, but flag if wrong):**
1. You're OK with a managed backend (Supabase) rather than self-hosting. *(If not, Phases 1–3 change to a Node + Postgres server; the schema and logic stay the same.)*
2. Young children do **not** log in themselves — a parent/teacher signs in, creates the child, and hands over a "kid mode" device. *(This is standard for ages 4–7 and shapes auth.)*
3. Budget starts on free tiers (Supabase free, Cloudflare Pages free) and upgrades only when traffic requires it.

---

## B. Data model (Sketch) — the whole schema

One row per child for progress keeps writes as simple idempotent upserts (safe for offline sync).

```sql
-- profiles: one per authenticated adult (extends Supabase auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  role        text not null default 'parent'
              check (role in ('parent','teacher','guardian')),
  referred_by text,                       -- e.g. 'educlynk' from ?ref
  created_at  timestamptz not null default now()
);

-- children: the learners
create table children (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  avatar     text not null default 'lion'
             check (avatar in ('lion','parrot','tortoise','dog')),
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- child_adults: many-to-many link (a child can have parent + teacher + guardian)
create table child_adults (
  child_id     uuid not null references children(id) on delete cascade,
  adult_id     uuid not null references profiles(id) on delete cascade,
  relationship text not null check (relationship in ('guardian','teacher')),
  created_at   timestamptz not null default now(),
  primary key (child_id, adult_id)
);
create index on child_adults (adult_id);
create index on child_adults (child_id);

-- progress: exactly one row per child (upsert target for offline sync)
create table progress (
  child_id        uuid primary key references children(id) on delete cascade,
  words           int  not null default 0,
  streak          int  not null default 0,
  stars           int  not null default 0,
  unlocked_stickers text[] not null default '{}',
  missed_phonemes jsonb not null default '{}',   -- {"A":3,"TH":1}, bounded ~34 keys
  updated_at      timestamptz not null default now()  -- last-write-wins clock
);
```

**RLS policies (the security spine — every table on):**
```sql
alter table profiles     enable row level security;
alter table children     enable row level security;
alter table child_adults enable row level security;
alter table progress     enable row level security;

-- an adult reads/updates only their own profile row
create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- an adult sees a child only if linked to it (or created it)
create policy "linked children" on children for select
  using (exists (select 1 from child_adults ca
                 where ca.child_id = children.id and ca.adult_id = auth.uid())
         or created_by = auth.uid());
create policy "create own children" on children for insert
  with check (created_by = auth.uid());
create policy "update linked children" on children for update
  using (exists (select 1 from child_adults ca
                 where ca.child_id = children.id and ca.adult_id = auth.uid()));

-- an adult sees only their own links
create policy "own links" on child_adults for select
  using (adult_id = auth.uid());
create policy "add links to my children" on child_adults for insert
  with check (exists (select 1 from children c
                      where c.id = child_id and c.created_by = auth.uid())
              or adult_id = auth.uid());

-- progress is readable/writable only for children the adult is linked to
create policy "progress of linked children" on progress for all
  using (exists (select 1 from child_adults ca
                 where ca.child_id = progress.child_id and ca.adult_id = auth.uid()))
  with check (exists (select 1 from child_adults ca
                      where ca.child_id = progress.child_id and ca.adult_id = auth.uid()));
```

This means: even if someone tampered with the front-end code, the database refuses to return another family's data. Security is not a UI concern.

---

## C. Cross-cutting best practices (apply to every task)

**Error handling**
- Wrap every Supabase call in a small `safe()` helper returning `{ data, error }`; **never throw into render**. On error: show a friendly message, keep the app usable with local data, and (for writes) queue for retry.
- The existing React **ErrorBoundary** stays as the last line of defense for render crashes.
- Add **Sentry** (free tier) to capture front-end errors and failed syncs with breadcrumbs.

**Caching**
- App shell: hashed immutable assets on the CDN + the existing PWA service-worker precache.
- Data reads (dashboards): **TanStack Query** with `staleTime` (e.g. 30s) — serve cached data instantly, revalidate in background. Fewer DB hits under load.
- Database: the indexes above; Supabase **connection pooling** (pgBouncer, transaction mode) for the API; read replicas only if/when needed.

**Offline sync**
- Writes go to local state + an **IndexedDB outbox** immediately (optimistic). A background flush upserts to Postgres when online. Upserts are **idempotent** (keyed by `child_id`), and `updated_at` gives **last-write-wins** conflict resolution across devices.

**Scale**
- Static PWA = infinite scale for the app. Per-child data is one indexed row → cheap. Dashboard fetches children+progress in **one joined query** (no N+1). Pooled connections handle spikes.

**Testing discipline**
- Unit tests (Vitest) for `store.js` logic and sync/outbox. RLS tested with SQL against Supabase (a policy test per table). e2e (Playwright) for the critical flows (sign in, create child, play, dashboard). Test-first within each task.

---

## Phase 0 — Foundations (domain, project, hosting, monitoring)

### Task 0.1: Register the domain and create the Supabase project
- **Clarify:** You need a home (domain) and the managed backend before anything else. Pick the domain (see the earlier 5 suggestions) and create a free Supabase project.
- **Sketch:** Buy domain at a registrar (Cloudflare/Namecheap). Create Supabase project; note the **Project URL** and **anon public key**. Create `.env` (gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`. Add `.env.example` (no secrets).
- **Estimate:** S.
- **Failure modes:** Committing keys → they leak. Mitigation: only the **anon** key is in the front end (safe by design because RLS protects data); never put the service-role key in the app. `.env` stays gitignored.
- **Deep dive / done:** `npm run dev` reads the env; a throwaway `supabase.from('profiles').select()` returns `[]` (empty, not an auth error). Commit `.env.example` and config, not `.env`.

### Task 0.2: Deploy the current app to the CDN with the domain
- **Clarify:** Get continuous deployment working early so every later change ships automatically.
- **Sketch:** Connect the repo to **Cloudflare Pages** (or Vercel). Build command `npm run build`, output `dist`. Point the domain's DNS at it. Enable HTTPS (automatic).
- **Estimate:** S.
- **Failure modes:** SPA deep links 404 on refresh. Mitigation: add a catch-all rewrite to `/index.html` (Cloudflare Pages `_redirects`: `/*  /index.html  200`).
- **Deep dive / done:** Visiting the domain loads the app over HTTPS; refreshing on a sub-route works; a push to `main` auto-deploys.

### Task 0.3: Add Sentry error monitoring
- **Clarify:** You must *see* production errors, not hear about them from users.
- **Sketch:** `npm i @sentry/react`. Init in `src/main.jsx` with the DSN and a low `tracesSampleRate`. Wrap the app; connect it to the existing ErrorBoundary.
- **Estimate:** S.
- **Failure modes:** Noisy PII in logs. Mitigation: scrub — don't send child names; send ids only.
- **Deep dive / done:** Throwing a test error in dev shows up in the Sentry dashboard; no names in the payload.

---

## Phase 1 — Auth (adult accounts, child profiles, kid mode)

### Task 1.1: Supabase client + auth context
- **Clarify:** One shared Supabase client and a React context exposing `session`, `signInWithOtp`, `verifyOtp`, `signOut`.
- **Sketch:**
  - Create `src/lib/supabase.js`: `export const supabase = createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true }})`.
  - Create `src/auth/AuthProvider.jsx`: holds `session`, subscribes to `supabase.auth.onAuthStateChange`, exposes helpers. Wrap `<App/>`.
  - **Produces:** `useAuth() → { session, user, signInWithOtp(email), verifyOtp(email, code), signOut() }`.
- **Estimate:** M.
- **Failure modes:** Token expiry mid-session → calls 401. Mitigation: `autoRefreshToken: true` handles it; on a hard 401, route to sign-in and keep local child data.
- **Deep dive / done:** Unit test the context with a mocked client (sign-in sets session; sign-out clears it). Edge cases: refresh persists session (persisted to localStorage), no session → `session === null`.

### Task 1.2: Adult sign-in screen (email OTP)
- **Clarify:** Parents/teachers sign in with just an email + a 6-digit code (no passwords — simpler and secure). This is the front door for the *adult* side only.
- **Sketch:**
  - `src/auth/SignIn.jsx`: email input → `signInWithOtp(email)` → "we sent you a code" → 6-digit input → `verifyOtp` → on success route to the adult home.
  - Capture `?ref=` from the URL on first load; pass into profile creation (Task 1.4).
  - **Consumes:** `useAuth()`.
- **Estimate:** M.
- **Failure modes:** Code expired / wrong code / email typo. Mitigation: show clear errors, a **Resend** button (rate-limited by Supabase), and let them re-enter the email.
- **Deep dive / done:** e2e (Playwright, using Supabase's test OTP or an inbox service): enter email → enter code → land signed in. Edge cases: wrong code shows an error and lets retry; resend works; expired code is rejected.

### Task 1.3: Database schema + RLS migration
- **Clarify:** Create every table and RLS policy from Section B as a versioned migration so it's reproducible.
- **Sketch:** Add the Supabase CLI; put Section B's SQL in `supabase/migrations/0001_init.sql`; run `supabase db push`. Include a `handle_new_user` trigger that inserts a `profiles` row when an auth user is created.
- **Estimate:** M.
- **Failure modes:** A missing/loose policy leaks data. Mitigation: **test every policy** (Task 1.5) before trusting it.
- **Deep dive / done:** Migration applies cleanly to a fresh project; `select` on each table with no session returns nothing (RLS denies by default).

### Task 1.4: Profile bootstrap + role selection
- **Clarify:** On first sign-in, ensure a `profiles` row exists and capture the adult's role (Parent / Teacher / Guardian) and any `?ref`.
- **Sketch:** After `verifyOtp`, upsert `profiles` (`id = user.id`, `email`, `role`, `referred_by`). A one-time role picker if `role` is unset.
- **Estimate:** S.
- **Failure modes:** Duplicate signup with same email → Supabase returns the same user (email is unique), so no dupes. Race on first insert → use `upsert` (idempotent).
- **Deep dive / done:** Test: first sign-in creates the profile with the chosen role and stored ref; second sign-in reuses it.

### Task 1.5: RLS policy tests
- **Clarify:** Prove one family cannot read another's data — the core safety guarantee.
- **Sketch:** `supabase/tests/rls.test.sql` (or a Vitest suite using two test users): user A creates child + progress; user B must get **zero rows** selecting that child/progress; A gets exactly their own.
- **Estimate:** M.
- **Failure modes:** A policy accidentally uses `USING (true)`. Mitigation: this test fails loudly if so.
- **Deep dive / done:** All cross-user reads return empty; owner reads succeed. This test is the gate for touching any RLS later.

### Task 1.6: Child profiles + "kid mode" handoff
- **Clarify:** A signed-in adult creates one or more children (name + avatar) and taps "Start" to hand the device to a child. Kid mode runs the existing app scoped to that child; the adult stays authenticated underneath.
- **Sketch:**
  - `src/auth/ChildPicker.jsx`: lists the adult's children (`children` join `child_adults`), "Add child" (reuses the existing Onboarding name+avatar UI, now writing to `children` + a `child_adults` guardian link + an empty `progress` row), and "Start" → sets the active `childId` in app state and enters kid mode.
  - Store active `childId` in memory + localStorage so a refresh on the shared device resumes the same child.
  - **Produces:** `activeChildId` available to `store.js`.
- **Estimate:** L.
- **Failure modes:** Adult signs out on a shared kid device → kid loses access. Mitigation: kid mode does not expose sign-out; only the math-gated adult area does.
- **Deep dive / done:** e2e: sign in → add child "Ada" → Start → land on kid Home bound to Ada. Edge cases: adult with several children picks one; adding a child creates exactly one guardian link + one progress row; long/unicode names accepted (≤40, enforced by the `check` constraint and an input `maxLength`).

### Task 1.7: Math-gate for the adult dashboard on a shared device
- **Clarify:** Replace the 3-tap gate with a simple math question so a young child can't open the parent dashboard, but an adult passes instantly. (Real auth already happened at sign-in; this just guards the shared device.)
- **Sketch:** `src/auth/AdultGate.jsx`: "What is 7 × 8?" random single-digit×single-digit; correct answer → show dashboard; wrong → reshuffle. Used before `ParentDashboard`.
- **Estimate:** S.
- **Failure modes:** Kid guesses. Mitigation: acceptable — the authoritative data is server-side and read-only to kids; the gate only hides a view.
- **Deep dive / done:** Test: correct answer reveals the dashboard; wrong answer does not and asks again.

---

## Phase 2 — Data layer (progress lives on the server)

### Task 2.1: Point `store.js` at Supabase (reads)
- **Clarify:** `store.js` becomes the one place that loads a child's progress from Postgres (falling back to local cache when offline).
- **Sketch:**
  - Extend `src/store.js`: `loadProgress(childId) → { words, streak, stars, unlockedStickers, missedPhonemes }`. Try Supabase `select` on `progress` where `child_id = childId`; on network error, return the last locally cached copy.
  - Keep a local mirror (IndexedDB via `idb-keyval`) keyed by `childId`.
  - **Consumes:** `activeChildId` (Task 1.6). **Produces:** `loadProgress`, `saveProgress` (2.2).
- **Estimate:** M.
- **Failure modes:** Offline on first ever load (no cache). Mitigation: return the zeroed default state; sync fills it when online.
- **Deep dive / done:** Unit test with a mocked client: online returns server row; offline returns cached row; missing returns defaults.

### Task 2.2: Write progress through `store.js` (optimistic + upsert)
- **Clarify:** Every stars/streak/word change updates local state instantly and writes to Postgres (queued if offline).
- **Sketch:**
  - `saveProgress(childId, patch)`: apply to local mirror immediately (optimistic), then `upsert` into `progress` with `updated_at = now()`. On network failure, enqueue in the outbox (Phase 3).
  - Wire `App.jsx`'s `handleWordCorrect/Missed/RoundComplete` and Phonics `+2` through `saveProgress` instead of local-only `setStats`.
  - **Consumes:** `loadProgress`. **Produces:** `saveProgress(childId, patch)`.
- **Estimate:** M.
- **Failure modes:** Double-count if a write retries. Mitigation: writes are **absolute upserts of the whole row** (not increments), so a retry is idempotent — the last known totals win.
- **Deep dive / done:** Test: a correct word bumps `stars` locally and upserts the full row; simulated failure leaves local state correct and an outbox entry queued.

### Task 2.3: Migrate any existing localStorage progress
- **Clarify:** Early testers may have local-only progress; don't lose it on first sign-in.
- **Sketch:** On first `saveProgress` for a child, if a legacy `lexia_state` exists locally, seed the child's row from it once, then clear the legacy key.
- **Estimate:** S.
- **Failure modes:** Re-running the migration double-seeds. Mitigation: a one-time `migrated` flag.
- **Deep dive / done:** Test: legacy state present → seeded once → flag set → not re-applied.

---

## Phase 3 — Offline sync (the outbox)

### Task 3.1: IndexedDB outbox
- **Clarify:** Pending writes survive refreshes and app closes, and flush when back online.
- **Sketch:**
  - `src/sync/outbox.js`: `enqueue(childId, patch)`, `all()`, `remove(id)` backed by `idb-keyval`. Each entry: `{ id, childId, row, updatedAt }`.
  - `saveProgress` enqueues on write failure (or always-enqueue-then-flush for simplicity).
  - **Produces:** `outbox` API + `flush()`.
- **Estimate:** M.
- **Failure modes:** Outbox grows unbounded if offline for days. Mitigation: it's one entry per child (latest wins) — **coalesce** by `childId` so it never exceeds the number of children.
- **Deep dive / done:** Test: enqueue two writes for the same child → one coalesced entry with the latest row.

### Task 3.2: Background flush + reconnect handling
- **Clarify:** Drain the outbox on reconnect and on an interval; resolve conflicts by last-write-wins.
- **Sketch:**
  - `src/sync/flush.js`: on `window 'online'` and every 30s while online, upsert each outbox row; on success `remove`. Compare `updated_at`; server keeps the newer.
  - Show a subtle "saved / saving…" indicator (optional, tiny).
  - **Consumes:** `outbox`, `supabase`.
- **Estimate:** M.
- **Failure modes:** Two devices edit the same child offline. Mitigation: last-write-wins by `updated_at` — acceptable for this data (a reading app, not banking). Document it.
- **Deep dive / done:** Test: queue while "offline", fire `online`, assert upsert called and outbox emptied; a stale entry (older `updated_at`) does not overwrite a newer server row.

---

## Phase 4 — Dashboards read from the server

### Task 4.1: Parent/teacher child list (one query, cached)
- **Clarify:** An adult's dashboard lists the children they're linked to, fetched in a single joined query and cached.
- **Sketch:**
  - Add TanStack Query. `useChildren()` → `select children.*, progress.* from children join child_adults ... join progress` where `adult_id = auth.uid()`. `staleTime: 30_000`.
  - **Produces:** `useChildren()`.
- **Estimate:** M.
- **Failure modes:** N+1 (a query per child). Mitigation: a single join, as above. Many children (a teacher's class) → **paginate** (range) at 50.
- **Deep dive / done:** Test/e2e: a teacher linked to 3 children sees all 3 with their stats in one request; an unlinked child never appears (RLS).

### Task 4.2: Per-child progress view (server-authoritative)
- **Clarify:** The existing Parent Dashboard reads the *server* record (words, stars, streak, struggle areas) for the selected child.
- **Sketch:** Feed `ParentDashboard` from `useChildren()`/a `useChildProgress(childId)` instead of local `stats`. Keep the existing UI; only the data source changes.
- **Estimate:** S.
- **Failure modes:** Stale view after a kid just played offline. Mitigation: TanStack Query revalidates on focus; show `updated_at` ("as of …").
- **Deep dive / done:** e2e: kid earns stars → after sync, adult dashboard reflects the new totals.

### Task 4.3: Teacher linking (class code or invite)
- **Clarify:** A teacher gains access to a child without using the parent's login — via a short **class/link code** the parent shares, which creates a `child_adults` teacher link.
- **Sketch:**
  - Parent generates a 6-char code per child (a `child_codes` table: `code`, `child_id`, `expires_at`). Teacher enters the code → server function inserts a `child_adults` (`relationship='teacher'`) link → code consumed.
  - Implement the redeem step as a Supabase **RPC (SECURITY DEFINER)** so it can insert the link after validating the code, without opening broad insert rights.
  - **Produces:** `redeemChildCode(code)`.
- **Estimate:** L.
- **Failure modes:** Code guessing / replay. Mitigation: random codes, `expires_at`, single-use (delete on redeem), rate-limit attempts.
- **Deep dive / done:** Test: valid code links the teacher (who then sees the child via RLS); expired/used code is rejected; teacher cannot see other children.

---

## Phase 5 — Real phonics audio (finish what's wired)

### Task 5.1: Record and add the 34 clips
- **Clarify:** The playback layer already prefers `public/audio/phonics/<letter>.mp3` and falls back to TTS. This task is producing and dropping in the files.
- **Sketch:** Follow `docs/phonics-recording-guide.md` (phone recording, split, name `a.mp3 … nk.mp3`). Place in `public/audio/phonics/`. They're auto-precached for offline (already configured in `vite.config.js`).
- **Estimate:** M (mostly recording/editing time, not code).
- **Failure modes:** Inconsistent volume between clips. Mitigation: normalize in Audacity; keep one voice.
- **Deep dive / done:** In Phonics Lab, every letter plays its recording; a deleted file falls back to TTS with no error (already verified for the empty case).

### Task 5.2: Preload the clips for instant playback
- **Clarify:** Avoid a first-tap delay while the audio loads.
- **Sketch:** On Phonics Lab mount, warm the browser cache (create `Audio(src)` for the current category, or rely on the service-worker precache). Keep a tiny in-memory cache of `Audio` objects in `speech.js`.
- **Estimate:** S.
- **Failure modes:** Preloading all at once on a slow connection. Mitigation: they're precached by the SW already; preload is a no-op after first load.
- **Deep dive / done:** Tapping a letter plays with no perceptible delay on a warm cache.

---

## Phase 6 — Educlynk partner link + attribution

### Task 6.1: Capture and store the referral source
- **Clarify:** When a user arrives from Educlynk (`?ref=educlynk`), record it so both sides can see attribution.
- **Sketch:** Read `?ref` on first load (Task 1.2 already captures it); persist to `profiles.referred_by` at signup (Task 1.4). Optionally send an anonymous "referral click" event to an analytics table.
- **Estimate:** S.
- **Failure modes:** Spoofed `ref`. Mitigation: it's attribution only, not a permission — spoofing it grants nothing.
- **Deep dive / done:** Signing up via `?ref=educlynk` stores `referred_by='educlynk'`.

### Task 6.2: Partner landing polish
- **Clarify:** People arriving from Educlynk should land on a clear, trustworthy entry (what it is, sign in / start).
- **Sketch:** A simple landing/marketing section at `/` for logged-out users (one screen: what LexiaCamer is, "For parents & teachers — sign in", a note that it's free/offline). Signed-in users skip straight to the child picker.
- **Estimate:** M.
- **Failure modes:** Slow first paint hurts click-through. Mitigation: it's static and CDN-cached; keep it light.
- **Deep dive / done:** Logged-out visit shows the landing; "Sign in" → OTP flow; logged-in visit → child picker.

---

## Phase 7 — Production hardening & launch

### Task 7.1: Global error handling pass
- **Clarify:** No unhandled promise rejections; every network/DB failure degrades gracefully.
- **Sketch:** Add the `safe()` wrapper around Supabase calls; a global `unhandledrejection` handler → Sentry; user-facing toasts for recoverable errors; offline banner already exists.
- **Estimate:** M.
- **Failure modes:** A silent failure hides data loss. Mitigation: writes always land in the outbox; surfaced if flush keeps failing.
- **Deep dive / done:** Simulate DB down: app stays usable, writes queue, a gentle "changes will sync" notice shows, Sentry logs it.

### Task 7.2: Indexes, pooling, and a load check
- **Clarify:** Confirm it stays fast under many users.
- **Sketch:** Verify the Section-B indexes exist; use Supabase's **pooled** connection string for the app; run a simple load test (k6/Artillery) hitting the dashboard query and a progress upsert at, say, 200 req/s; watch Postgres CPU.
- **Estimate:** M.
- **Failure modes:** A missing index causes a sequential scan under load. Mitigation: the load test surfaces it; add the index.
- **Deep dive / done:** At target load, dashboard reads are indexed (`explain analyze` shows index scans) and p95 latency stays low; no connection exhaustion (pooling).

### Task 7.3: Data lifecycle — delete & export
- **Clarify:** Parents can delete a child (and its data), and reset progress (already built); support a basic data export for privacy requests.
- **Sketch:** "Delete child" (behind the gate) → `delete from children` (cascades to links + progress). "Reset progress" already exists → make it call the server (`update progress ... = defaults`). A JSON export of a child's data on request.
- **Estimate:** M.
- **Failure modes:** Accidental delete. Mitigation: typed confirmation (like reset).
- **Deep dive / done:** Delete removes the child, its links, and progress (verified by RLS test); reset zeroes the server row; export returns the child's JSON.

### Task 7.4: Privacy, backups, and launch checklist
- **Clarify:** Children's data has legal weight; be deliberate before launch.
- **Sketch:** Confirm Supabase automated backups are on; write a short privacy policy (what's stored, why, deletion path); verify no PII in Sentry; add a `robots`/security headers via the CDN; final cross-device QA pass (the browser QA flow already used).
- **Estimate:** M.
- **Failure modes:** Launching without a deletion path or backups. Mitigation: this checklist blocks launch until each item is ticked.
- **Deep dive / done:** Every item in the launch checklist (Section F) is checked.

---

## D. Suggested order & rough total

Phases are sequential for the backend spine (0 → 1 → 2 → 3 → 4), with 5 (audio), 6 (partner link), and parts of 7 runnable in parallel once Phase 1 is green.

| Phase | Focus | Rough effort |
|---|---|---|
| 0 | Domain, Supabase, hosting, Sentry | ~1–2 days |
| 1 | Auth, schema+RLS, kid mode, gate | ~4–6 days |
| 2 | Progress on the server | ~2–3 days |
| 3 | Offline sync | ~2 days |
| 4 | Dashboards from server + teacher linking | ~3–4 days |
| 5 | Phonics recordings | ~1–2 days (mostly recording) |
| 6 | Educlynk link + attribution | ~1–2 days |
| 7 | Hardening, load, privacy, launch | ~3–4 days |

Total: roughly **3–4 focused weeks** solo-with-AI. Ship after Phase 4 as a usable v1; 5–7 harden and complete it.

---

## E. Failure-mode & edge-case matrix (global)

| Area | Edge case | Handling |
|---|---|---|
| Auth | OTP expired / wrong / email typo | Clear error, resend (rate-limited), re-enter email |
| Auth | Token expires mid-session | Auto-refresh; hard-fail → sign-in, local data kept |
| Auth | Duplicate email signup | Same user returned (email unique); profile upserted |
| Data | Offline first-ever load | Return zeroed defaults; sync fills later |
| Data | Write retried | Absolute-row upsert = idempotent (no double count) |
| Sync | Two devices edit offline | Last-write-wins by `updated_at`; documented |
| Sync | Outbox grows | Coalesce to one entry per child |
| Security | Front-end tampered | RLS blocks other families at the DB |
| Teacher | Code guessed / reused | Random, expiring, single-use, rate-limited |
| Dashboard | Big class | Paginate at 50; single joined query |
| Content | Long / unicode child name | `check (1..40)` + input `maxLength` |
| Audio | Clip missing / bad | Falls back to TTS, no crash (verified) |
| Kid | Clears localStorage | Server is source of truth; re-syncs |
| Referral | Spoofed `?ref` | Attribution only; grants nothing |
| Ops | DB briefly down | App usable on local data; writes queue; Sentry logs |

---

## F. Launch-readiness checklist

- [ ] Domain live over HTTPS; auto-deploy from `main`; SPA rewrite in place
- [ ] Supabase: schema + all RLS policies applied; **RLS tests pass**
- [ ] Only the anon key is in the front end; service-role key never shipped
- [ ] Email OTP sign-in works end to end (incl. resend, expiry)
- [ ] Kid mode: add child → play → progress saves to server
- [ ] Offline: play with network off → reconnect → data syncs (LWW verified)
- [ ] Dashboards read server data; teacher linking via code works; unlinked data never visible
- [ ] Phonics clips in place; TTS fallback verified for any missing
- [ ] Global error handling: DB-down simulation stays usable; Sentry receives errors (no PII)
- [ ] Indexes present; pooled connections; load test p95 acceptable
- [ ] Delete child + reset progress + export all work; typed confirms on destructive actions
- [ ] Backups on; privacy policy written; deletion path documented
- [ ] Final cross-device QA (phone / tablet / laptop) clean

---

## Self-review notes (coverage)

- **Auth (email OTP, roles, kid mode, gate):** Phase 1. ✅
- **Own backend + best DB (Postgres) + security (RLS):** Sections A/B, Phase 1. ✅
- **Progress storage + `store.js` seam:** Phase 2. ✅
- **Offline + heavy traffic:** Phase 3 (outbox) + Section C + Task 7.2. ✅
- **Dashboards + teacher access without parent email:** Phase 4. ✅
- **Pronunciation recordings:** Phase 5 (playback already built). ✅
- **Educlynk partner link + attribution:** Phase 6. ✅
- **Error handling, caching, edge cases, launch safety:** Section C, Phase 7, Sections E/F. ✅
