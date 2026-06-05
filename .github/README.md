# GitHub

CI and repository automation for Resolve.

## What's here

| Path | Purpose |
|------|---------|
| [`workflows/ci.yml`](workflows/ci.yml) | Parallel lint/typecheck/build + E2E on PRs and `main` |

## Usage

CI runs automatically on pull requests and pushes to `main`.

Locally, match static checks before opening a PR:

```bash
cd frontend && bun ci && bun run lint && bun run typecheck && bun run build
```

E2E (requires local Supabase): see [../frontend/e2e/README.md](../frontend/e2e/README.md).

## Notes

- Root directory for Vercel is `frontend/` (see [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).
- Scripts validators are not run in CI (they need a live seeded database).
- Superseded workflow runs are cancelled via `concurrency` to save runner minutes.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
