# Scripts

Node.js utilities to load hackathon CSV data into Supabase and verify the database matches expectations. **Not Bun** — use npm in this directory.

## Prerequisites

- Node.js 20+
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same as the app)
- Supabase project with migrations applied

## Usage

```bash
cd scripts
npm install
npm run seed              # CSVs + demo incident
npm run validate:counts   # row counts vs data pack
npm run validate:metrics  # RPC sanity checks
npm run validate          # both validators
```

Load env from the app:

```bash
node --env-file=../frontend/.env.local seed.mjs
```

## What's here

| File | Purpose |
|------|---------|
| `seed.mjs` | Upsert Pretty Fly CSVs from `pretty_fly_data_pack/data/` |
| `validate-counts.mjs` | Assert table row counts |
| `check-metrics.mjs` | Assert metrics RPCs on seeded data |
| `lib/supabase.mjs` | `createScriptClient()` |
| `lib/chunk.mjs` | `chunkArray()` for batched writes |

## Notes

- Validators need a **real** seeded project; CI uses placeholder Supabase URLs and does not run these scripts.
- Do not commit `node_modules/` (gitignored).

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
