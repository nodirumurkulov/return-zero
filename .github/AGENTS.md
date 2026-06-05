# AGENTS.md — .github

CI configuration. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## CI workflow

[workflows/ci.yml](workflows/ci.yml) on every PR and `main` push:

- **Parallel:** `lint`, `typecheck`, `test` (Vitest unit + `test:integration`), and `build` jobs (shared Bun cache; build caches `frontend/.next/cache`)
- **E2E:** after `build` — Supabase start, `seed`, Playwright (`CI=true`, 1 worker)
- **Concurrency:** cancels superseded runs on the same branch

Database migrations are **not** deployed from CI. Supabase GitHub integration handles preview branches (PR) and production deploy (`main`). See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) §4.

```bash
cd frontend && bun ci && bun run check && bun run build
# E2E locally: supabase start, seed, build, CI=true bun run e2e
```

Supabase keys are exported to `$GITHUB_ENV` in the E2E job (not `.env.local`).

## Migration PR checklist (local — not in CI)

Before opening a PR that touches `frontend/supabase/**`:

```bash
cd frontend/supabase && supabase start && cd ..
bun run db:reset
supabase db diff --use-pg-delta   # expect "No schema changes found"
bun run db:lint && bun run db:test:rls && bun run db:check-types
bun run seed && bun run validate
```

Require **Supabase Preview** status check on `main` (Dashboard + GitHub branch protection).

## Best practices

- CI encodes **non-negotiable quality** (lint, types, unit tests, build, E2E) — workflow changes must not trade checks for backward compat with broken code.

## Pull request rules

- Do not disable or weaken CI checks without explicit user request.
- Do not add `continue-on-error` to lint/typecheck/test/build/e2e steps.
- Do not re-add `db-push.yml` or `integration-db` — Supabase GitHub integration owns remote migration deploy.

## Before pushing

```bash
cd frontend && bun run check && bun run build
# parity with CI e2e path:
cd supabase && supabase start && cd ..
bun run seed && CI=true bun run e2e
```
