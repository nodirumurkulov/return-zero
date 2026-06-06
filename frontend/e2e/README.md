# Playwright E2E

End-to-end tests for Resolve (auth, catalog, incidents, orders replay, onboarding) against local Supabase + seeded data.

## Environment

Scripts read **`process.env`** (and Bun/Next auto-load `frontend/.env.local` when present locally).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (app + auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client in Playwright fixtures + seed |
| `NEXT_PUBLIC_APP_URL` | App origin (default `http://127.0.0.1:3000`) |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Optional; defaults in `e2e/constants.ts` |

### Local

```bash
cd frontend/supabase && supabase start && cd ..
# Option A: .env.local (Bun/Next load it automatically)
cp ../.env.example .env.local   # fill from `supabase status`
# Option B: export vars in your shell from `supabase status -o env`
bun run db:reset && bun run seed -- --full --e2e && bun run build
bun run e2e:install && CI=true bun run e2e
```

Database bootstrap runs via **`seed --full --e2e`** before Playwright (not in global-setup). Playwright only runs auth setup + specs.

## Commands

```bash
bun run e2e          # dev server locally; production server when CI=true
bun run e2e:ui
bun run e2e:headed
bun run e2e:install
```

## CI

GitHub Actions pipeline:

1. **Parallel:** `lint`, `typecheck`, `test` (unit + `test:integration`), `build`
2. **`e2e`** (after parallel jobs): Supabase start → `seed --full --e2e` → production server + Playwright (`CI=true`, **1 worker** for fixture stability)

Supabase starts with trimmed services (`--exclude studio,imgproxy,mailpit,edge-runtime`); migrations apply on first start — **no `db reset`**.

### Specs

| Spec | Coverage |
|------|----------|
| `auth`, `catalog`, `incidents` | Core flows, threshold save persistence |
| `incident-detail` | Approve low-risk → monitoring; deterministic fixtures via `e2e/fixtures/db-resets.ts` |
| `orders` | Orders feed start control |
| `onboarding` | Connect demo store; mocked import → catalog |
| `replay` | ReplayControl advance |

### Fixtures

- `e2e/fixtures/index.ts` — `test.extend` with Supabase admin client
- `e2e/fixtures/demo-data.ts` — kanban incidents (loaded by `seed --full`)
- `e2e/fixtures/e2e-user.ts` — E2E auth user + detected incident (loaded by `seed --e2e`)
