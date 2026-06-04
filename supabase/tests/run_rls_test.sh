#!/usr/bin/env bash
# run_rls_test.sh  (RUN-34)
# Applies every migration in order to a Postgres database, then runs the RLS
# assertions in rls_policies_test.sql as the anon and authenticated roles.
#
# Usage:
#   PGHOST=/tmp PGPORT=55432 PGUSER=postgres ./supabase/tests/run_rls_test.sh
# Defaults target a local trust-auth cluster on /tmp:55432 (see PR description).
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

echo "==> create Supabase-like roles (must exist before policies reference them)"
run -c "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end \$\$;"

echo "==> apply all migrations in order"
for f in "$MIG"/*.sql; do
  echo "    - $(basename "$f")"
  run -f "$f"
done

echo "==> grant table privileges to roles (mimics Supabase defaults) + seed"
run -c "grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
insert into products(product_id, title) values ('P1','Test product') on conflict do nothing;
insert into incidents(title) values ('seed incident');
-- metric_definitions ('return_rate', ...) is seeded by 003_metrics_config.sql
insert into product_kpi_thresholds(product_id, metric_key, threshold)
  values ('P1', 'return_rate', 0.1) on conflict do nothing;"

echo "==> run RLS assertions"
run -f "$ROOT/supabase/tests/rls_policies_test.sql"
