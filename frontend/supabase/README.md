# Supabase

PostgreSQL schema, views, RPCs, and RLS policies for Resolve.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) **≥2.54** (CI uses 2.105.x; older CLIs fail to parse `config.toml`)
- Docker (for `supabase start` / `supabase db reset`)

## Usage

```bash
supabase start              # local API + Postgres
bun run db:reset            # replay migrations + Bun seed (CSVs + demo incidents)
bun run db:lint             # migration lint
bun run db:types            # generate lib/supabase/database.types.ts
bun run db:types:check      # regen types and fail if committed file drifts
bun run db:test:rls         # run tests/rls_policies_test.sql (after reset)
supabase db push            # apply migrations to linked remote project
```

Migrations live in `migrations/`. Demo data: [`../scripts/README.md`](../scripts/README.md) (`bun run seed`).

## Migration workflow

1. `supabase migration new <name>` — creates a timestamped file
2. Add SQL (or `supabase db pull <name> --local --yes` after local iteration)
3. `bun run db:reset && bun run db:lint && bun run db:test:rls && bun run db:types`
4. Commit migration + updated `database.types.ts` + domain types in one PR
5. Deploy: `supabase db push` against the linked remote project

Existing `001_`–`017_` migrations keep their names; new migrations use CLI timestamps.

## What's here

| Area | Purpose |
|------|---------|
| `migrations/` | Versioned SQL (tables, views, RPCs, RLS) |
| `tests/rls_policies_test.sql` | RLS policy checks (anon vs authenticated) |

## Notes

- Service role bypasses RLS — used only via `createAdminClient()` (cron, seed, Slack webhook).
- Changing RPC signatures requires updating `frontend/lib/metrics` and `frontend/scripts/validate-metrics.ts`.
- `[db.seed]` is disabled; `bun run db:reset` runs the Bun seed script after migrations.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
