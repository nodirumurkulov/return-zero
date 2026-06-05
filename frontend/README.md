# Frontend

Next.js 16 App Router application for Resolve: catalog KPIs, incident workflow, API routes, and Supabase Auth.

## Prerequisites

- Bun 1.3+
- `frontend/.env.local` from repo [`.env.example`](../.env.example)

After `supabase start`, copy Supabase URL/keys from `supabase status` into `.env.local`, then also copy the **Demo login** block (`DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`) from `.env.example`. Run `bun run seed` to load Pretty Fly data and create the demo account.

## Usage

```bash
bun install
bun run dev          # http://localhost:3000
bun run check        # lint + typecheck
bun run build
bun run db:reset       # requires supabase start
```

| Script | Purpose |
|--------|---------|
| `dev` | Local dev server |
| `check` | ESLint (`--max-warnings 0`) + `tsc` |
| `build` | Production build |
| `db:reset` / `db:lint` / `db:test:rls` | Supabase CLI — migrations and RLS tests |
| `seed` | Load CSVs, demo incidents, and demo auth user |
| `db:types` | Regenerate `lib/supabase/database.types.ts` |

## What's here

| Path | Purpose |
|------|---------|
| [`app/`](app/) | Routes, pages, API handlers |
| [`components/`](components/) | React UI (server + client islands) |
| [`lib/`](lib/) | Domain logic, Supabase server client, agents |
| [`proxy.ts`](proxy.ts) | Supabase session refresh (Next 16 proxy) |
| [`eslint.config.mjs`](eslint.config.mjs) | Strict flat config |

Data loads on the **server** (`createServiceClient`, domain queries). Client components handle mutations and call `router.refresh()` after success.

## Notes

- Package manager is **Bun** (`bun.lock`), not npm.
- Vercel project root must be **`frontend`**, not the repo root.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
