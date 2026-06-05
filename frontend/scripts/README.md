# Scripts

Bun CLI utilities to bootstrap the demo org and validate the database. New signups auto-provision the Pretty Fly demo store at account creation; `seed.ts` creates org + demo user only. Load store fixtures for E2E via `demo-fixtures.ts` or sign up through the app.

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
```

## What's here

| File | Purpose |
|------|---------|
| `seed.ts` | Demo org + auth user (no store data) |
| `demo-fixtures.ts` | Load Pretty Fly store + KPI thresholds + demo incidents (E2E global-setup) |
| `validate-counts.ts` | Assert table row counts |
| `validate-metrics.ts` | Assert metrics RPCs on seeded data |
No separate `scripts/` package at repo root; `createClient()` from `@supabase/supabase-js` in each script. DB setup uses Supabase CLI (`bun run db:reset` in `frontend/`).

## Notes

- Validators need store data loaded (signup provisioning, E2E `demo-fixtures`, or `/onboarding` learn flow); CI does not run these.

**Agents:** [../AGENTS.md](../AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
