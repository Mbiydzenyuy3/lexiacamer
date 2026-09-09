#!/usr/bin/env bash
#
# Apply every migration to a real Supabase project, in order.
#
#   ./supabase/apply.sh "postgresql://postgres.<ref>:<password>@<host>:5432/postgres"
#
# Get that string from your Supabase dashboard:
#   Project Settings -> Database -> Connection string -> URI
# Use the SESSION pooler (port 5432), not the transaction pooler (6543):
# migrations create functions and triggers, which need a session connection.
#
# Safe to re-run: every migration is written to be idempotent where it can be,
# and it stops at the first error rather than half-applying.
#
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <database-url>" >&2
  exit 1
fi

DB_URL="$1"
cd "$(dirname "$0")/.."

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install postgresql-client first." >&2
  exit 1
fi

echo "Applying migrations..."
for f in supabase/migrations/*.sql; do
  echo "  -> $(basename "$f")"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done

echo
echo "Done. Verifying the security spine is actually on:"
psql "$DB_URL" -q -c "
  select tablename,
         case when rowsecurity then 'RLS on' else '*** RLS OFF ***' end as status
    from pg_tables
   where schemaname = 'public'
   order by rowsecurity, tablename;"

echo
echo "Any row above reading '*** RLS OFF ***' is readable by anyone on the"
echo "internet holding your public anon key. There should be none."
