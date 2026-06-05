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
bun run check            # lint + typecheck + test
bun run build
bun run db:lint
```

| Script | Purpose |
|--------|---------|
| `dev` | Local server |
| `check` | ESLint (`--max-warnings 0`) + `tsc` + Vitest + API integration |
| `build` | Production build |
| `db:reset` / `db:sync` / `db:diff` / `db:lint` / `db:test:rls` / `db:check-types` | Supabase CLI (see [supabase/README.md](supabase/README.md)) |
| `seed` | Demo org + auth user; store data via onboarding connect ([scripts/README.md](scripts/README.md)) |
| `validate` | Row counts + metrics RPC checks |
| `test` / `test:watch` | Vitest (components + `lib/**/*.test.ts`) |
| `test:lib` | Vitest — `lib/**` only (fast iteration) |
| `test:integration` | API route handlers (`vitest.integration.config.ts`) |
| `e2e` / `test:e2e` / `e2e:ui` / `e2e:headed` | Playwright ([e2e/README.md](e2e/README.md)) |
| `e2e:install` | Chromium for local runs |

ESLint: [eslint.config.mjs](eslint.config.mjs) — `functional/no-let`, import order, IIFE ban.

## Best practices (this package)

- **No backward compat:** remove dead routes, clients, and re-exports; refactor call sites instead of aliasing old exports.
- Apply **Next.js 16 + React 19** idioms: RSC by default, small client islands, `router.refresh()` / `revalidatePath` after mutations.
- If ESLint or types complain, **fix the design** (extract function, move logic to `lib/`) — do not disable rules or add `@ts-expect-error` without explicit user approval.

## Code style

- Follow root [AGENTS.md](../AGENTS.md) mandate and [Best practices mandate](../AGENTS.md#best-practices-mandate): no `let`, no IIFEs, no Supabase wrapper shims, domain imports from `@/lib/*`.
- Path alias `@/` → project root.
- Auth: [proxy.ts](proxy.ts) (Supabase session). Do not bypass without reason.

## Testing

Test pyramid (fast → slow):

| Layer | Command | Scope |
|-------|---------|--------|
| Unit — `lib/` | `bun run test:lib` | Pure domain logic (detection, metrics, approve, slack, cron-auth) |
| Unit — UI | `bun run test` | Co-located `components/**/*.test.tsx` + all Vitest includes |
| API integration | `bun run test:integration` | Cron/auth + Zod on selected routes (mocked Supabase) |
| DB integration | Local pre-PR (see [supabase/README.md](supabase/README.md)) | `db:reset`, schema diff, RLS, type freshness, `validate` |
| E2E | `CI=true bun run e2e` | Playwright against seeded Supabase + production build |

- `bun run check` — lint, typecheck, unit tests, and API integration.
- E2E path: `supabase start` → `seed` → `build` → `CI=true bun run e2e` (CI uses 1 worker for stability).
- After changes touching metrics/detection: `bun run validate` against a seeded DB.

## Nested guides

| Path | Focus |
|------|--------|
| [app/AGENTS.md](app/AGENTS.md) | Pages, RSC, actions |
| [app/api/AGENTS.md](app/api/AGENTS.md) | HTTP handlers |
| [components/AGENTS.md](components/AGENTS.md) | UI |
| [lib/AGENTS.md](lib/AGENTS.md) | Domain modules |
