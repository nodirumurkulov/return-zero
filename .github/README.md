# GitHub

CI and repository automation for Hugo.

## What's here

| Path | Purpose |
|------|---------|
| [`workflows/ci.yml`](workflows/ci.yml) | Parallel lint/typecheck/test/build + E2E on PRs and `main` |

Database migrations deploy via **Supabase GitHub integration** (not GitHub Actions). See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) §4.

## Usage

CI runs automatically on pull requests and pushes to `main`.

Locally, match static checks before opening a PR:

```bash
cd frontend && bun ci && bun run check && bun run build
```

For migration PRs, also run the local DB checklist in [AGENTS.md](AGENTS.md#migration-pr-checklist-local--not-in-ci).

E2E (requires local Supabase): see [../frontend/e2e/README.md](../frontend/e2e/README.md).

Supabase credentials are exported to the job environment (`$GITHUB_ENV`) in the E2E job, not written to `.env.local`.

## Notes

- Root directory for Vercel is `frontend/` (see [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).
- RLS tests, schema drift, and `db:check-types` are **local pre-PR** checks — not in CI.
- Require **Supabase Preview** on `main` via GitHub branch protection after enabling Supabase GitHub integration.
- Superseded workflow runs are cancelled via `concurrency` to save runner minutes.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
