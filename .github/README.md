# GitHub

CI and repository automation for Resolve.

## What's here

| Path | Purpose |
|------|---------|
| [`workflows/ci.yml`](workflows/ci.yml) | Parallel lint/typecheck/test/build + E2E on PRs and `main` |

## Usage

CI runs automatically on pull requests and pushes to `main`.

Locally, match static checks before opening a PR:

```bash
cd frontend && bun ci && bun run check && bun run build
```

E2E (requires local Supabase): see [../frontend/e2e/README.md](../frontend/e2e/README.md).

Supabase credentials are exported to the job environment (`$GITHUB_ENV`), not written to `.env.local`.

## Notes

- Root directory for Vercel is `frontend/` (see [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).
- RLS tests (`db:test:rls`) and seed validators (`validate`) are not run in CI — run locally against a seeded Supabase project.
- Superseded workflow runs are cancelled via `concurrency` to save runner minutes.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
