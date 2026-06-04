# GitHub

## CI

[`workflows/ci.yml`](workflows/ci.yml): `check` → Supabase → env vars → `db:reset` → `seed` → `build` → Playwright.

Supabase credentials are exported to the job environment (`$GITHUB_ENV`), not written to `.env.local`.

**Agents:** [AGENTS.md](AGENTS.md)
