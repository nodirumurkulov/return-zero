# AGENTS.md — frontend

Next.js 16 App Router application. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## Setup commands

```bash
cd frontend
bun install
cp ../.env.example .env.local   # if missing
```

## Development workflow

```bash
bun run dev              # dev server
bun run check            # lint + typecheck
bun run build
bun run db:lint
```

| Script | Purpose |
|--------|---------|
| `dev` | Local server |
| `check` | ESLint (`--max-warnings 0`) + `tsc` |
| `build` | Production build |
| `db:reset` / `db:lint` / `db:test:rls` | Supabase CLI (see [supabase/README.md](supabase/README.md)) |
| `seed` | Load CSVs + demo incidents ([scripts/README.md](scripts/README.md)) |
| `validate` | Row counts + metrics RPC checks |

ESLint: [eslint.config.mjs](eslint.config.mjs) — `functional/no-let`, import order, IIFE ban.

## Best practices (this package)

- **No backward compat:** remove dead routes, clients, and re-exports; refactor call sites instead of aliasing old exports.
- Apply **Next.js 16 + React 19** idioms: RSC by default, small client islands, `router.refresh()` / `revalidatePath` after mutations.
- If ESLint or types complain, **fix the design** (extract function, move logic to `lib/`) — do not disable rules or add `@ts-expect-error` without explicit user approval.

## Code style

- Follow root [AGENTS.md](../AGENTS.md) mandate and [Best practices mandate](../AGENTS.md#best-practices-mandate): no `let`, no IIFEs, domain imports from `@/lib/*`.
- Path alias `@/` → project root.
- Auth: [proxy.ts](proxy.ts) (Supabase session). Do not bypass without reason.

## Testing

- `bun run test` — Vitest (lib + co-located `components/**/*.test.tsx`).
- `bun run test:watch` — Vitest watch mode.
- `bun run test:e2e` — Playwright (local or CI e2e job).
- `bun run check` — lint, typecheck, and `test`.
- After changes touching metrics/detection: `bun run validate` against a seeded DB.

## Nested guides

| Path | Focus |
|------|--------|
| [app/AGENTS.md](app/AGENTS.md) | Pages, RSC, actions |
| [app/api/AGENTS.md](app/api/AGENTS.md) | HTTP handlers |
| [components/AGENTS.md](components/AGENTS.md) | UI |
| [lib/AGENTS.md](lib/AGENTS.md) | Domain modules |
