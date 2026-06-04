# Supabase

PostgreSQL schema, views, RPCs, and RLS policies for Resolve.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for `supabase start` / `supabase db reset`)

## Usage

```bash
supabase start              # local API + Postgres
bun run db:reset            # replay migrations
bun run db:lint             # migration lint
bun run db:types            # generate lib/supabase/database.types.ts
bun run db:test:rls         # run tests/rls_policies_test.sql (after reset)
supabase db push            # apply migrations to linked remote project
```

Migrations live in `migrations/`. Seed data: [`../scripts/README.md`](../scripts/README.md).

## What's here

| Area | Purpose |
|------|---------|
| `migrations/` | Versioned SQL (tables, views, RPCs, RLS) |
| `tests/rls_policies_test.sql` | RLS policy checks (anon vs authenticated) |

## Notes

- Service role bypasses RLS — used only via `createAdminClient()` (cron, seed, Slack webhook).
- Changing RPC signatures requires updating `frontend/lib/metrics` and `frontend/scripts/validate-metrics.ts`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
