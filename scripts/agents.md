# scripts/

Node.js utilities (not Bun). Run with `node script.mjs` from this directory.

## Files

- `seed.mjs` — load Pretty Fly CSV pack into Supabase
- `validate-counts.mjs` — assert row counts for CI

## Rules

- Prefer `const` and `for...of` over index `let` loops.
- Do not commit `node_modules/` (gitignored).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

No frontend ESLint here; keep scripts readable and linear.
