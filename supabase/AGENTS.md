# supabase/

Postgres schema and RLS tests for Resolve.

## Layout

- `migrations/` — ordered SQL migrations (apply via Supabase CLI)
- `tests/` — RLS test SQL + `run_rls_test.sh`
- `config.toml` — local Supabase config

## Rules

- Schema changes require a new migration file; do not edit old migrations in place.
- Row shapes in frontend should match migrations; update `lib/*/db.ts` when columns change.

Humans: use Supabase dashboard or CLI for apply/push — not documented step-by-step here.
