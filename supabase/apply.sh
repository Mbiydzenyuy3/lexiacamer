#!/usr/bin/env bash
#
# Apply pending migrations to a Supabase project, in order, once each.
#
#   ./supabase/apply.sh "<database-url>"
#   ./supabase/apply.sh "<database-url>" --baseline 0006_subscriptions.sql
#   ./supabase/apply.sh "<database-url>" --status
#
# Applied migrations are recorded in schema_migrations, so re-running only
# applies what is new. A runner that cannot be re-run safely is a footgun:
# without this, the second run fails on "relation already exists" and you are
# left picking files by hand.
#
# --baseline marks every migration up to and including that file as applied
# WITHOUT running it. Use it once, on a database that was set up before this
# tracking existed.
#
# Get the URL from the Supabase dashboard: Connect -> Session pooler.
# NOT "Direct connection": that host is IPv6-only and fails on networks
# without IPv6 routing. The session pooler is reachable over IPv4 and its
# username is postgres.<project-ref>, not plain postgres.
#
# PREFER LEAVING THE PASSWORD OUT OF THE URL. A URL with the password in it
# goes into your shell history, and into the process list where any other user
# on the machine can read it with ps. psql reads $PGPASSWORD instead:
#
#   read -rsp "DB password: " PGPASSWORD; export PGPASSWORD; echo
#   ./supabase/apply.sh "postgresql://postgres.<ref>@aws-<n>-<region>.pooler.supabase.com:5432/postgres"
#   unset PGPASSWORD
#
# If a password has ever been pasted somewhere it should not be, reset it in
# the dashboard: Settings -> Database -> Reset database password. That key
# bypasses every row-level security policy in the project.
#
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <database-url> [--baseline <file>] [--status]" >&2
  exit 1
fi

DB_URL="$1"; shift

# An empty or non-postgres URL makes psql silently fall back to a local socket
# and fail as your unix user, which looks like a password problem and is not.
# Catch it here and say what is actually wrong.
case "$DB_URL" in
  postgres://*|postgresql://*) ;;
  "")
    echo "No database URL given." >&2
    echo "If you used \$DB_URL, it is not set in this shell. Either:" >&2
    echo "  export DB_URL=\"postgresql://postgres.<ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres\"" >&2
    echo "or paste the URI directly as the first argument." >&2
    exit 1 ;;
  *)
    echo "That does not look like a database URL: it must start with postgresql://" >&2
    echo "Get it from the Supabase dashboard: Connect -> Session pooler." >&2
    exit 1 ;;
esac
# The direct-connection host is IPv6-only. On a network without IPv6 routing it
# fails as "Network is unreachable", which points at the server rather than at
# the address you chose. Check whether IPv6 actually works before trying, so
# the advice is definite instead of a maybe.
case "$DB_URL" in
  *db.*.supabase.co*)
    if ! ping6 -c1 -W2 db.supabase.co >/dev/null 2>&1 \
       && ! ip -6 route get 2001:4860:4860::8888 >/dev/null 2>&1; then
      _ref=$(printf '%s' "$DB_URL" | sed -n 's|.*db\.\([a-z0-9]*\)\.supabase\.co.*|\1|p')
      cat >&2 <<MSG
This machine has no IPv6 route, and that host is IPv6-only. It cannot work.

You changed the username but not the host. BOTH have to change together:

  host:      db.${_ref}.supabase.co   ->  aws-<n>-<region>.pooler.supabase.com
  username:  postgres                  ->  postgres.${_ref}

Do not type the region by hand. In the Supabase dashboard:
  Connect  ->  Session pooler  ->  copy the whole URI, replace the password.
MSG
      exit 1
    fi ;;
esac

MODE="apply"
BASELINE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --baseline) MODE="baseline"; BASELINE="${2:-}"; shift 2 ;;
    --status)   MODE="status";   shift ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."

command -v psql >/dev/null 2>&1 || {
  echo "psql not found. Install postgresql-client first." >&2; exit 1; }

PSQL="psql $DB_URL -v ON_ERROR_STOP=1 -q -t -A"

# Connect once before doing anything, so a bad credential is reported as a bad
# credential. Raw psql says `password authentication failed for user
# "postgres"` even when the username you gave was postgres.<ref>, because the
# pooler reports the base role -- which reads as "my username is wrong" and
# sends people to change the one part that was already correct.
if ! _probe=$(psql "$DB_URL" -v ON_ERROR_STOP=1 -q -t -A -c 'select 1' 2>&1); then
  case "$_probe" in
    *"password authentication failed"*|*"SASL"*)
      cat >&2 <<'MSG'

Could not sign in to the database.

The host and username are fine -- this is the password. psql names the user
as "postgres" no matter what you passed, because the pooler reports the base
role, so the username is not the thing to change.

  1. Supabase dashboard -> Settings -> Database -> Reset database password
  2. Re-run, keeping the new password out of your shell history:

       read -rsp "DB password: " PGPASSWORD; export PGPASSWORD; echo
       ./supabase/apply.sh "postgresql://postgres.<ref>@<host>:5432/postgres"
       unset PGPASSWORD

MSG
      exit 1 ;;
    *)
      echo "Could not connect to the database:" >&2
      echo "$_probe" >&2
      exit 1 ;;
  esac
fi

$PSQL -c "create table if not exists schema_migrations (
            filename   text primary key,
            applied_at timestamptz not null default now());" >/dev/null

applied() { $PSQL -c "select 1 from schema_migrations where filename = '$1';"; }

# A database created before tracking existed has tables but no records. Say so
# rather than failing on "already exists" and leaving them to guess.
if [ "$MODE" = "apply" ] \
   && [ -z "$($PSQL -c 'select 1 from schema_migrations limit 1;')" ] \
   && [ -n "$($PSQL -c "select 1 from pg_tables where schemaname='public' and tablename='profiles';")" ]; then
  echo "This database already has tables but no migration records."
  echo "Mark what is already applied, then re-run. For example:"
  echo
  echo "  $0 \"\$DB_URL\" --baseline 0006_subscriptions.sql"
  exit 1
fi

if [ "$MODE" = "baseline" ]; then
  [ -n "$BASELINE" ] || { echo "--baseline needs a filename" >&2; exit 1; }
  for f in supabase/migrations/*.sql; do
    name="$(basename "$f")"
    $PSQL -c "insert into schema_migrations (filename) values ('$name')
              on conflict do nothing;" >/dev/null
    echo "  recorded $name"
    [ "$name" = "$BASELINE" ] && break
  done
  echo "Baseline set. Run without --baseline to apply the rest."
  exit 0
fi

if [ "$MODE" = "status" ]; then
  for f in supabase/migrations/*.sql; do
    name="$(basename "$f")"
    if [ -n "$(applied "$name")" ]; then echo "  applied  $name"
    else echo "  PENDING  $name"; fi
  done
  exit 0
fi

echo "Applying pending migrations..."
count=0
for f in supabase/migrations/*.sql; do
  name="$(basename "$f")"
  if [ -n "$(applied "$name")" ]; then
    echo "  skip     $name (already applied)"
    continue
  fi
  echo "  apply    $name"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
  $PSQL -c "insert into schema_migrations (filename) values ('$name');" >/dev/null
  count=$((count + 1))
done
echo "$count migration(s) applied."

echo
echo "Verifying the security spine is on:"
psql "$DB_URL" -q -c "
  select tablename,
         case when rowsecurity then 'RLS on' else '*** RLS OFF ***' end as status
    from pg_tables
   where schemaname = 'public'
     and tablename <> 'schema_migrations'
   order by rowsecurity, tablename;"

echo
echo "Any row reading '*** RLS OFF ***' is readable by anyone on the internet"
echo "holding your public anon key. There should be none."
