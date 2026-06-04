# scripts/

Node.js utilities (not Bun). Run via `npm run <script>` from this directory.

## Files

| File | Purpose |
|------|---------|
| `seed.mjs` | Load Pretty Fly CSV pack + demo incident into Supabase |
| `validate-counts.mjs` | Assert table row counts match `data/README.md` |
| `check-metrics.mjs` | Sanity-check metrics RPCs after seed |
| `lib/supabase.mjs` | `createScriptClient()` — shared env + client |
| `lib/chunk.mjs` | `chunkArray()` for batched writes |

## Rules

- Prefer `const` and `for...of`; no `let` index loops.
- Do not commit `node_modules/` (gitignored).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Validators need a real seeded Supabase project (not CI placeholder URLs).

No frontend ESLint here; keep scripts linear and readable.
