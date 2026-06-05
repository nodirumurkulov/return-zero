# AGENTS.md — .github

CI configuration. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## CI workflow

[workflows/ci.yml](workflows/ci.yml) on every PR and `main` push:

- **Parallel:** `lint`, `typecheck`, `test` (Vitest unit + `test:integration`), and `build` jobs (shared Bun cache; build caches `frontend/.next/cache`)
- **`integration-db`:** after `build` — Supabase start, `seed`, `bun run db:test:rls`, `bun run validate`
- **E2E:** after `integration-db` — Playwright against production build (`CI=true`, 1 worker)
- **Concurrency:** cancels superseded runs on the same branch

```bash
cd frontend && bun ci && bun run check && bun run build
# E2E locally: supabase start, seed, build, CI=true bun run e2e
```

Supabase keys are exported to `$GITHUB_ENV` in the E2E job (not `.env.local`).

## Best practices

- CI encodes **non-negotiable quality** (lint, types, unit tests, build, E2E) — workflow changes must not trade checks for backward compat with broken code.

## Pull request rules

- Do not disable or weaken CI checks without explicit user request.
- Do not add `continue-on-error` to lint/typecheck/test/build/e2e steps.
- `validate` and RLS tests run in the **`integration-db`** job (seeded local Supabase).

## Before pushing

```bash
cd frontend && bun run check && bun run build
# parity with CI e2e path:
cd supabase && supabase start && cd ..
bun run seed && CI=true bun run e2e
```
