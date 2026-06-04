# Supabase

PostgreSQL schema, views, RPCs, and RLS policies for Resolve.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Linked Supabase project (`supabase link`)

## Usage

```bash
supabase db push          # apply migrations to linked project
supabase migration list   # inspect history
```

Migrations live in `migrations/`. RLS and policy tests may live alongside SQL in this tree.

After migrations, seed from [`../frontend/scripts/README.md`](../frontend/scripts/README.md).

## What's here

| Area | Purpose |
|------|---------|
| `migrations/` | Versioned SQL (tables, views, RPCs, RLS) |
| Tests / helpers | Policy verification scripts (if present) |

The app reads through typed domain modules in `frontend/lib/*`, not generated Supabase types.

## Notes

- Service role bypasses RLS — used only via `createAdminClient()` (cron, seed, Slack webhook).
- Changing RPC signatures requires updating `frontend/lib/metrics` and `frontend/scripts/validate-metrics.ts`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
