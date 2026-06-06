# Supabase

PostgreSQL schema, views, RPCs, and RLS policies for Hugo.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) **≥2.54** (CI uses 2.105.x)
- Docker (for `supabase start` / `supabase db reset`)

## Declarative schema workflow

Schema is defined as **desired-state SQL** in [`schemas/`](schemas/). Migrations in [`migrations/`](migrations/) are generated automatically — do not hand-write migration SQL for routine DDL changes.

Docs: [Declarative database schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas) · [pg-delta changelog](https://supabase.com/changelog/44938-public-alpha-declarative-schema-management-with-pg-delta)

### After `git pull` (migrations changed)

```bash
cd frontend && bun run db:sync   # reset local DB + regenerate database.types.ts
bun run seed
```

### Making a schema change

```bash
# 1. Edit desired state (not migrations/)
vim supabase/schemas/005_incidents_schema.sql

# 2. Generate migration (pg-delta diff)
cd frontend && bun run db:diff -- add_my_column

# 3. Apply locally + regen types
bun run db:sync

# 4. Validate
bun run db:test:rls && bun run seed && bun run validate
```

Alternative (experimental sync — applies migration automatically):

```bash
cd frontend && bun run db:schema:sync -- --name add_my_column
bun run db:types
```

### Bootstrap / regenerate schemas from local DB

If schemas drift from migrations, regenerate from a clean local DB:

```bash
cd frontend/supabase && supabase start
cd .. && bun run db:reset
bun run db:schema:generate
```

Or per [Supabase docs](https://supabase.com/docs/guides/local-development/declarative-database-schemas#pulling-in-your-production-schema):

```bash
supabase db dump --local -f supabase/schemas/prod.sql
```

## Commands

```bash
supabase start              # local API + Postgres
bun run db:reset            # replay migrations
bun run db:sync             # reset + regenerate TypeScript types
bun run db:diff -- <name>   # generate migration from schema edit
bun run db:lint             # migration lint
bun run db:types            # generate lib/supabase/database.types.ts
bun run db:check-types      # fail if database.types.ts is stale
bun run db:test:rls         # run tests/rls_policies_test.sql (after reset)
supabase db push            # apply migrations to linked remote project
```

Demo data: [`../scripts/README.md`](../scripts/README.md) (`bun run seed` — not SQL seed).

## Layout

| Path | Role |
|------|------|
| `schemas/` | **Source of truth** — desired-state SQL; edit these |
| `migrations/` | Generated/historical versioned SQL — never edit in place |
| `tests/rls_policies_test.sql` | RLS policy checks |
| `config.toml` | `schema_paths` + `[experimental.pgdelta]` |

## Caveats (from Supabase docs)

- Service role bypasses RLS — used only via `createAdminClient()` (cron, seed, Slack webhook).
- Changing RPC signatures requires updating `frontend/lib/stores/analytics/metrics` and `frontend/scripts/validate-metrics.ts`.
- Diff tools may miss: DML (`insert`/`update`), some `alter policy` statements, publications, storage buckets. Use imperative migrations for those edge cases. See [known caveats](https://supabase.com/docs/guides/local-development/declarative-database-schemas#known-caveats).

### Before opening a migration PR

CI does not run schema drift, RLS, or type-sync checks — run locally:

```bash
cd frontend/supabase && supabase start && cd ..
bun run db:reset
supabase db diff --use-pg-delta   # expect "No schema changes found"
bun run db:lint && bun run db:test:rls && bun run db:check-types
```

## Remote deploy

Migrations deploy via **Supabase GitHub integration** (preview branches on PRs, production on merge to `main`). Working directory in the Dashboard must be `frontend`. See [`../../docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) §4.

Preview branches do not copy production data. Demo data remains `bun run seed` against preview credentials from the PR comment, or local dev only.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)
