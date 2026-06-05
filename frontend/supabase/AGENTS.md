# AGENTS.md — supabase

Postgres schema, views, RPCs, RLS. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## Setup commands

```bash
supabase start                 # local stack (once per machine)
supabase link                  # remote project (deploy)
cd .. && bun run db:reset      # apply migrations locally
cd .. && bun run db:sync       # reset + regenerate database.types.ts
cd .. && bun run db:lint       # lint migrations
cd .. && bun run db:types      # regenerate TypeScript types only
```

## Layout

| Path | Role |
|------|------|
| `schemas/` | **Edit these** — declarative desired-state SQL ([Supabase docs](https://supabase.com/docs/guides/local-development/declarative-database-schemas)) |
| `migrations/` | Generated versioned SQL — **never edit old files in place** |
| `tests/rls_policies_test.sql` | RLS assertions (`bun run db:test:rls` after reset) |
| `config.toml` | `schema_paths` order + `[experimental.pgdelta]` |

## Schema change workflow

1. Edit `schemas/<domain>.sql` (desired state).
2. `bun run db:diff -- <snake_case_name>` — generates `migrations/<timestamp>_<name>.sql` via pg-delta.
3. `bun run db:sync` — apply + regen `database.types.ts`.
4. Update seed/validators if needed; `bun run db:test:rls && bun run validate`.

Do **not** hand-write migration SQL for routine table/column/RPC changes. Imperative migrations only for diff-tool caveats (DML seeds, some policy alters).

## Best practices

- **Postgres idioms:** indexes, constraints, and RLS policies named clearly.
- Schema change PR: `schemas/` + generated migration + `database.types.ts` + seed/validators in **one PR**.
- Table types in `lib/` use `Tables<"table_name">` aliases — no hand-copied column lists.
- User-facing app code uses `createClient()` (RLS); admin client only for cron, seed, Slack.

## Testing

```bash
supabase start
cd .. && bun run db:reset && bun run db:lint && bun run db:test:rls && bun run db:check-types
```

After seed: `cd .. && bun run validate`
