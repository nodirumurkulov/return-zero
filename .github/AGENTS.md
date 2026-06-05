# AGENTS.md — .github

CI configuration. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## CI workflow

[workflows/ci.yml](workflows/ci.yml) runs on PRs and pushes to `main`:

- **Parallel:** `lint`, `typecheck`, and `build` jobs (shared Bun cache; build caches `frontend/.next/cache`)
- **E2E:** after static checks pass — local Supabase (trimmed services), `seed`, Playwright against production build
- **Concurrency:** cancels superseded runs on the same branch

```bash
cd frontend && bun ci && bun run check && bun run build
# E2E locally: supabase start, seed, build, CI=true bun run e2e
```

Uses real Supabase keys from `supabase start` in the E2E job; lint/typecheck/build use placeholder env only where needed.

## Best practices

- CI encodes **non-negotiable quality** (lint, types, build, E2E) — workflow changes must not trade checks for backward compat with broken code.

## Pull request rules

- Do not disable or weaken CI checks without explicit user request.
- Do not add `continue-on-error` to lint/typecheck/build/e2e steps.
- Scripts validators are **not** in CI (need live DB).

## Before pushing

Match CI locally:

```bash
cd frontend && bun run check && bun run build
```
