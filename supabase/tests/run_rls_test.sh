#!/usr/bin/env bash
# run_rls_test.sh  (RUN-34)
# Spins the migrations up against a Postgres database and runs the RLS
# assertions in rls_policies_test.sql as the anon and authenticated roles.
#
# Usage:
#   PG="psql 'postgres://...'"  ./supabase/tests/run_rls_test.sh
# or set PGHOST/PGPORT/PGUSER/PGDATABASE and run directly. Defaults target a
# local trust-auth cluster on 127.0.0.1:55432 (see PR description).
set -euo pipefail

PSQL=${PSQL:-psql}
export PGHOST=${PGHOST:-/tmp}
export PGPORT=${PGPORT:-55432}
export PGUSER=${PGUSER:-postgres}
export PGDATABASE=${PGDATABASE:-rlstest}

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"

run() { $PSQL -v ON_ERROR_STOP=1 -q "$@"; }

echo "==> (re)create database $PGDATABASE"
$PSQL -v ON_ERROR_STOP=1 -d postgres -q -c "drop database if exists $PGDATABASE" \
  -c "create database $PGDATABASE"

echo "==> create Supabase-like roles"
run -c "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;"

echo "==> apply migrations 001, 002"
run -f "$MIG/001_base_data_schema.sql"
run -f "$MIG/002_incidents_schema.sql"

echo "==> create kpi_thresholds stub (RUN-9 owns the real table; test-only here)"
run -c "create table if not exists kpi_thresholds (
  id uuid primary key default uuid_generate_v4(),
  kpi_name text not null,
  threshold numeric
);"

echo "==> apply migration 003 (RLS policies)"
run -f "$MIG/003_rls_policies.sql"

echo "==> grant table privileges to roles (mimics Supabase defaults) + seed"
run -c "grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
insert into products(product_id, title) values ('P1','Test product') on conflict do nothing;
insert into incidents(title) values ('seed incident');
insert into kpi_thresholds(kpi_name, threshold) values ('return_rate', 0.1);"

echo "==> run RLS assertions"
run -f "$ROOT/supabase/tests/rls_policies_test.sql"
