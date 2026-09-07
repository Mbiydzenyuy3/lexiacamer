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
  until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do :; done
fi

$PSQL -q -c 'drop schema if exists public cascade; drop schema if exists auth cascade; create schema public;'
$PSQL -q -f supabase/tests/00_local_shim.sql
$PSQL -q -f supabase/migrations/0001_init.sql
$PSQL -q -f supabase/tests/01_grants.sql
$PSQL -f supabase/tests/02_rls_test.sql
