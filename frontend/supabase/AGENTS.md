# AGENTS.md — supabase

Postgres schema, views, RPCs, RLS. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## Setup commands

```bash
supabase start                 # local stack (once per machine)
supabase link                  # remote project (deploy)
cd .. && bun run db:reset      # replay migrations + Bun seed
cd .. && bun run db:lint       # lint migrations
cd .. && bun run db:types      # regenerate TypeScript types
cd .. && bun run db:types:check  # regen + fail if database.types.ts drifts
```

## Layout

| Path | Role |
|------|------|
| `migrations/` | Ordered SQL — never edit old files in place |
| `tests/rls_policies_test.sql` | RLS assertions (run via `bun run db:test:rls` after reset) |
| `config.toml` | Local Supabase config |

## Migration workflow (Supabase CLI)

1. `supabase start`
2. Iterate schema locally (`supabase db query` or psql — **not** `apply_migration` for experimentation)
3. When ready: `supabase migration new <descriptive_name>` (timestamp filename)
4. Capture diff: `supabase db pull <descriptive_name> --local --yes` (or hand-write SQL if diff is noisy)
5. `supabase db advisors` — fix security findings
6. `bun run db:reset && bun run db:lint && bun run db:test:rls && bun run db:types`
7. Update domain types + validators in the same PR
8. Remote deploy: `supabase db push`

**Naming:** new migrations use CLI timestamps (`YYYYMMDDHHMMSS_name.sql`). Existing `001`–`017` files stay unchanged.

## Pre-PR checklist

| Step | Command |
|------|---------|
| Reset + seed | `bun run db:reset` |
| Lint migrations | `bun run db:lint` |
| RLS tests | `bun run db:test:rls` |
| Types in sync | `bun run db:types:check` |
| Validators | `bun run validate` |
| App checks | `bun run check && bun run build` |

## Best practices

- **Postgres idioms:** indexes, constraints, and RLS policies named clearly; avoid breaking migrations in place.
- **RLS on every `public` table** — enable in the same migration that creates the table (or a follow-up migration).
- Column renames/types: migration + `frontend/lib/supabase/database.types.ts` + seed/validators in **one PR** — no “DB first, types later” compat window.

## Rules

- New schema change → **new migration file** only.
- When columns change, run `bun run db:types` and update domain types in the same PR.
- User-facing app code uses `createClient()` (RLS); admin client only for cron, seed, Slack.
- Demo data: `bun run seed` (Bun script) — SQL seed is disabled in `config.toml`.

## Testing

```bash
supabase start
cd .. && bun run db:reset && bun run db:lint && bun run db:test:rls
```

After seed: `cd .. && bun run validate`
