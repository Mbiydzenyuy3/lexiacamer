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
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <database-url> [--baseline <file>] [--status]" >&2
  exit 1
fi

DB_URL="$1"; shift
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
