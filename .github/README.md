# GitHub

CI and repository automation for Resolve.

## What's here

| Path | Purpose |
|------|---------|
| [`workflows/ci.yml`](workflows/ci.yml) | Frontend lint, typecheck, build on PRs and `main` |

## Usage

CI runs automatically on pull requests and pushes to `main`.

Locally, match CI before opening a PR:

```bash
cd frontend && bun ci && bun run lint && bun run typecheck && bun run build
```

The workflow uses placeholder Clerk and Supabase env vars so the app builds without real secrets.

## Notes

- Root directory for Vercel is `frontend/` (see [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).
- Scripts validators are not run in CI (they need a live seeded database).

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
