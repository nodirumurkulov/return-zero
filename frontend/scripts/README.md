# Scripts

Bun CLI utilities to seed Pretty Fly CSVs into Supabase and validate the database. Same package as the app — uses `@supabase/supabase-js` and `.env.local` directly.

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

Scripts load env via `--env-file=.env.local` in `package.json`. Or run manually:

```bash
bun --env-file=.env.local run scripts/seed.ts
```

## What's here

| File | Purpose |
|------|---------|
| `seed.ts` | Upsert CSVs from `hackathon/data-pack/data/` + demo incidents |
| `validate-counts.ts` | Assert table row counts |
| `validate-metrics.ts` | Assert metrics RPCs on seeded data |
No separate `scripts/` package at repo root; `createClient()` from `@supabase/supabase-js` in each script. DB setup uses Supabase CLI (`bun run db:reset` in `frontend/`).

## Notes

- Validators need a **real** seeded project; CI does not run these.
- Batched writes in `seed.ts` use inline `Array.from` slices (500 rows per request).

**Agents:** [../AGENTS.md](../AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
