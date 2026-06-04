# Playwright E2E

End-to-end tests for Resolve (auth, catalog, incidents) against local Supabase + seeded data.

## Environment

Scripts read **`process.env`** (and Bun/Next auto-load `frontend/.env.local` when present locally).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (app + auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Global setup (admin) |
| `NEXT_PUBLIC_APP_URL` | App origin (default `http://127.0.0.1:3000`) |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Optional; defaults in `e2e/constants.ts` |

### Local

```bash
cd frontend/supabase && supabase start && cd ..
# Option A: .env.local (Bun/Next load it automatically)
cp ../.env.example .env.local   # fill from `supabase status`
# Option B: export vars in your shell from `supabase status -o env`
bun run db:reset && bun run seed && bun run build
bun run e2e:install && CI=true bun run e2e
```

## Commands

```bash
bun run e2e          # dev server locally; production server when CI=true
bun run e2e:ui
bun run e2e:headed
bun run e2e:install
```

## CI

GitHub Actions exports Supabase keys to `$GITHUB_ENV` after `supabase start` — no `.env.local` file. Then: `db:reset` → `seed` → `build` → `e2e`.
