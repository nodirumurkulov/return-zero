# AGENTS.md — scripts

Node.js seed and validation (not Bun). **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## Setup commands

```bash
cd scripts
npm install
```

## Commands

```bash
npm run seed
npm run validate:counts
npm run validate:metrics
npm run validate
```

Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (use `createScriptClient()` in `lib/supabase.mjs`).

## Files

| File | Role |
|------|------|
| `seed.mjs` | Load CSVs from `pretty_fly_data_pack/data/` |
| `validate-counts.mjs` | Row count assertions |
| `check-metrics.mjs` | RPC sanity checks |
| `lib/chunk.mjs` | `chunkArray()` |
| `lib/supabase.mjs` | Shared client |

## Code style

- `const` and `for...of` only; no `let` index loops.
- No frontend ESLint; keep scripts linear.
- Do not commit `node_modules/`.

## Testing

Validators require a **real seeded** Supabase project — CI does not run these scripts.
