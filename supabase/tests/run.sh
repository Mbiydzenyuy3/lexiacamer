#!/usr/bin/env bash
# Rebuild a throwaway Postgres and run the RLS attack suite from scratch.
set -euo pipefail
cd "$(dirname "$0")/../.."

CONTAINER=lexia-rls-test
PORT=55432
export PGPASSWORD=test
PSQL="psql -h localhost -p $PORT -U postgres -d lexia -v ON_ERROR_STOP=1"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker run -d --rm --name "$CONTAINER" \
    -e POSTGRES_PASSWORD=test -e POSTGRES_DB=lexia -p $PORT:5432 \
    postgres:16-alpine >/dev/null
fi

# pg_isready goes true during init, then the server restarts — so poll with a
# real query instead, or the first psql of the run dies on a closed connection.
for _ in $(seq 1 60); do
  if psql -h localhost -p $PORT -U postgres -d lexia -c 'select 1' >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

$PSQL -q -c 'drop schema if exists public cascade; drop schema if exists auth cascade; create schema public;'
$PSQL -q -f supabase/tests/00_local_shim.sql
$PSQL -q -f supabase/migrations/0001_init.sql
$PSQL -q -f supabase/migrations/0002_device_sync.sql
$PSQL -q -f supabase/migrations/0003_invites.sql
$PSQL -q -f supabase/migrations/0004_progress_aggregate.sql
$PSQL -q -f supabase/tests/01_grants.sql
$PSQL -q -f supabase/tests/02_rls_test.sql
$PSQL -q -f supabase/tests/03_sync_test.sql
$PSQL -q -f supabase/tests/04_invite_test.sql
$PSQL -q -f supabase/tests/05_progress_test.sql
$PSQL -f supabase/tests/99_summary.sql
