# Frontend

Next.js 16 App Router application for Resolve: catalog KPIs, incident workflow, API routes, and Clerk auth.

## Prerequisites

- Bun 1.3+
- `frontend/.env.local` from repo [`.env.example`](../.env.example)

## Usage

```bash
bun install
bun run dev          # http://localhost:3000
bun run check        # lint + typecheck
bun run build
bun run verify:secrets
```

| Script | Purpose |
|--------|---------|
| `dev` | Local dev server |
| `check` | ESLint (`--max-warnings 0`) + `tsc` |
| `build` | Production build |
| `verify:secrets` | Ensures service keys are not referenced from client code |

## What's here

| Path | Purpose |
|------|---------|
| [`app/`](app/) | Routes, pages, API handlers |
| [`components/`](components/) | React UI (server + client islands) |
| [`lib/`](lib/) | Domain logic, Supabase server client, agents |
| [`proxy.ts`](proxy.ts) | Clerk middleware (Next 16 proxy) |
| [`eslint.config.mjs`](eslint.config.mjs) | Strict flat config |

Data loads on the **server** (`createServiceClient`, domain queries). Client components handle mutations and call `router.refresh()` after success.

## Notes

- Package manager is **Bun** (`bun.lock`), not npm.
- Vercel project root must be **`frontend`**, not the repo root.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
