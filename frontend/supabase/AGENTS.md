# AGENTS.md — supabase

Postgres schema, views, RPCs, RLS. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## Setup commands

```bash
supabase start                 # local stack (once per machine)
supabase link                  # remote project (deploy)
cd .. && bun run db:reset      # apply migrations locally
cd .. && bun run db:lint       # lint migrations
cd .. && bun run db:types      # regenerate TypeScript types
```

## Layout

| Path | Role |
|------|------|
| `migrations/` | Ordered SQL — never edit old files in place |
| `tests/rls_policies_test.sql` | RLS assertions (run via `bun run db:test:rls` after reset) |
| `config.toml` | Local Supabase config |

## Best practices

- **Postgres idioms:** indexes, constraints, and RLS policies named clearly; avoid breaking migrations in place.
- Column renames/types: migration + `frontend/lib/supabase/database.types.ts` + seed/validators in **one PR** — no “DB first, types later” compat window.

## Rules

- New schema change → **new migration file** only.
- When columns change, run `bun run db:types` and update domain types in the same PR.
- User-facing app code uses `createClient()` (RLS); admin client only for cron, seed, Slack.

## Testing

```bash
supabase start
cd .. && bun run db:reset && bun run db:lint && bun run db:test:rls
```

After seed: `cd .. && bun run validate`
