# Standing up the backend

Everything is written and tested against a throwaway Postgres. This is the
5-minute job of pointing it at a real project. You need a Supabase account.

## 1. Create the project

<https://supabase.com/dashboard> → **New project**.

- **Region:** pick the one closest to Cameroon (usually `eu-west` / `eu-central`).
  Note which you chose: a school will eventually ask where children's data
  physically lives, and it is easier to answer than to move later.
- **Database password:** generate a strong one and put it in your password
  manager. You cannot read it back out of the dashboard afterwards.
- Free tier is fine to start. Note that free projects **pause after a stretch of
  inactivity** - fine while building, not fine the week traffic arrives.

## 2. Apply the schema

In the dashboard, **Connect** -> **Session pooler**. Three connection strings
are offered and only this one works:

| Option | Why not |
|---|---|
| Direct connection | Host is **IPv6-only**. On a network without IPv6 routing it fails with "Permission denied", which reads like a password problem and is not. |
| Transaction pooler (6543) | Cannot create functions or triggers. |
| **Session pooler (5432)** | **Use this one.** |

The session pooler username is `postgres.<project-ref>`, not plain `postgres`.

```bash
./supabase/apply.sh "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Applied migrations are recorded in `schema_migrations`, so re-running only
applies what is new. If the database was set up before that tracking existed,
the script says so and tells you to baseline it once:

```bash
./supabase/apply.sh "$DB_URL" --baseline 0006_subscriptions.sql   # record, do not run
./supabase/apply.sh "$DB_URL"                                     # apply the rest
./supabase/apply.sh "$DB_URL" --status                            # what is pending
```

It then prints the RLS status of every table. **Every row must read `RLS on`.** Anything reading `*** RLS OFF ***` is
readable by anyone on the internet holding your public anon key.

## 3. Point the app at it

Project Settings → API. Copy the **Project URL** and the **anon / public** key.

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

`.env` is gitignored. **Only the anon key belongs in it.** The `service_role`
key on that same page bypasses every RLS policy in the project: it is the
master key to every child's record. It never goes in `.env`, never in `src/`,
and never in the browser. It belongs only in the school-onboarding script, run
from your machine.

Restart `npm run dev`. The console line about running fully offline should stop
appearing.

## 4. Before any real user signs in: bring your own SMTP

Supabase's built-in email sender is rate-limited and documented as being for
testing only. Email OTP is your **entire front door** - if mail stops, nobody
can sign in and nobody can sign up.

Authentication → Emails → SMTP Settings, and point it at a real provider
(Resend, Postmark, SES) with a verified sending domain.

Do this before you pitch a school, not after. A director watching a demo where
the code never arrives is not a demo you recover from.

## 5. Verify

```bash
npm test                    # 33 JS tests
./supabase/tests/run.sh     # 157 SQL tests, against local Docker
```

The SQL suite runs against a throwaway container, not your project: it is a
regression gate, not a check on your live data.

To sanity-check the real project, sign in and confirm a fresh account sees
nothing it should not:

```sql
-- as a brand-new signed-in user, all of these must return 0 rows
select count(*) from students;
select count(*) from activity_events;
select count(*) from schools;
```

## Where the keys live

| Key | Lives | Why |
|---|---|---|
| anon / public | `.env`, browser bundle | Public by design; RLS protects the data |
| service_role | your machine only | Bypasses all RLS: the master key |

If the service-role key ever reaches the browser, every child's record on the
platform is readable by anyone who views source.
