# Scripts

Bun CLI utilities to bootstrap the demo org and validate the database.

## Prerequisites

- Bun (same as the frontend app)
- `frontend/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Supabase migrations applied

## Usage

```bash
cd frontend
bun install
bun run seed
bun run validate:counts
bun run validate:metrics
bun run validate
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment (or in `frontend/.env.local` for local runs).

```bash
bun run scripts/seed.ts
bun run scripts/seed.ts -- --full          # + Hugo mock store + demo kanban incidents
bun run scripts/seed.ts -- --full --e2e    # + E2E user (for Playwright)
```

## What's here

| File | Purpose |
|------|---------|
| `seed.ts` | Demo org + auth user; `--full` loads store + incidents; `--e2e` adds Playwright user |
| `validate-counts.ts` | Assert table row counts |
| `validate-metrics.ts` | Assert metrics RPCs on seeded data |

No separate `scripts/` package at repo root; `createClient()` from `@supabase/supabase-js` in each script. DB setup uses Supabase CLI (`bun run db:reset` in `frontend/`).

## Notes

- Validators need store data loaded (`seed --full` or onboarding connect); CI does not run these.
- Store import for scripts uses `provisionMockCsvStore` from `lib/stores/import/provision.ts` (script-safe, no `server-only`).

**Agents:** [../AGENTS.md](../AGENTS.md)  
**Parent:** [../README.md](../README.md)
