# AGENTS.md — .github

CI configuration. **Parent:** [../AGENTS.md](../AGENTS.md) · **Humans:** [README.md](README.md)

## CI workflow

[workflows/ci.yml](workflows/ci.yml) on every PR and `main` push:

```text
bun ci → check → supabase start → env vars → db:reset → seed → build → playwright e2e
```

Supabase keys go to `$GITHUB_ENV` (not `.env.local`). Requires Docker. E2E always runs.

## Before pushing

```bash
cd frontend && bun run check && bun run build
# parity with CI e2e path:
cd supabase && supabase start && cd ..
bun run db:reset && bun run seed && CI=true bun run e2e
```
