# AGENTS.md

Instructions for AI coding agents working in **return-zero** (Resolve). Humans: see [README.md](README.md).

## Project overview

Resolve is an ecommerce incident-response app for the Pretty Fly demo brand: detect KPI breaches, run AI investigation, approve fixes, monitor recovery.

| Area | Path | Stack |
|------|------|-------|
| Web app + API | `frontend/` | Next.js 16, React 19, Bun, Clerk |
| Database | `supabase/` | Postgres migrations, RLS |
| Data tooling | `scripts/` | Node.js (not Bun) |
| Long-form docs | `docs/` | Deployment, analytics |

**Closest `AGENTS.md` wins.** Read the file in the directory you edit, then parent files up to this root.

## Setup commands

```bash
cp .env.example frontend/.env.local   # fill Supabase, Clerk, LLM keys
cd frontend && bun install
cd scripts && npm install             # only for seed/validate
```

Apply DB migrations (Supabase CLI) before seeding. See [supabase/AGENTS.md](supabase/AGENTS.md) and [scripts/AGENTS.md](scripts/AGENTS.md).

```bash
cd scripts && npm run seed
```

## Development workflow

```bash
cd frontend && bun run dev          # http://localhost:3000
cd frontend && bun run check        # lint + typecheck
cd frontend && bun run build
cd frontend && bun run verify:secrets
```

Package managers: **Bun** in `frontend/`, **npm** in `scripts/`. Do not mix them per package.

## Testing instructions

- No automated test suite yet; CI runs lint, typecheck, and build only.
- After schema or metrics changes: `cd scripts && npm run validate` against a seeded Supabase project.
- RLS: see `supabase/tests/` if present.
- When adding behavior, prefer extending existing domain modules with clear types over ad-hoc route logic.

## Code style

- Prefer **`const`**. No **`let`** unless ESLint cannot be satisfied (rare). No **`var`**.
- No **IIFEs** for variable init (sync or async). Use a named function or inline `safeParse`. ESLint enforces via `no-restricted-syntax`.
- Prefer pure functions, `reduce`, and early returns over mutable index loops.
- **Redesign over backward compatibility.** Delete deprecated surfaces in the same change; fix all imports.
- **Domain modules** under `frontend/lib/<domain>/`: types match Supabase columns, queries, mutations, Zod `schemas.ts`.
- Import from `@/lib/incidents`, `@/lib/catalog`, etc. Never re-export domain types from `components/`.
- **API JSON:** Zod in `lib/<domain>/schemas.ts`; routes use `schema.safeParse(await req.json().catch(...))` inline.
- **React:** Server Components fetch data; small `"use client"` islands for mutations; use `router.refresh()` after client mutations.
- JSX async handlers: `onClick={() => { void handler(); }}` for `no-misused-promises`.

Run before every PR:

```bash
cd frontend && bun run lint && bun run typecheck && bun run build && bun run verify:secrets
```

## Security

- Never put server secrets in `NEXT_PUBLIC_*` or client components.
- `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, LLM keys, `SLACK_*`, `CRON_SECRET` are server-only.
- Use `createServiceClient()` from `@/lib/supabase/server` in routes and RSC only.
- Run `bun run verify:secrets` after touching env usage or client files.

## Build and deployment

- Production build: `cd frontend && bun run build`
- Vercel **Root Directory**: `frontend` (not repo root)
- Details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Pull request guidelines

- Keep PRs focused; match existing commit style (RUN-XX prefix when tied to Linear).
- CI must pass: `.github/workflows/ci.yml` (Bun install, lint, typecheck, build).
- Do not weaken ESLint (`--max-warnings 0`) or skip hooks unless the user asks.
- Update the nearest `README.md` and `AGENTS.md` when behavior or workflows change.

## Monorepo map

| Path | AGENTS.md |
|------|-----------|
| [frontend/](frontend/AGENTS.md) | App, Bun, ESLint |
| [frontend/app/](frontend/app/AGENTS.md) | Routes, RSC |
| [frontend/app/api/](frontend/app/api/AGENTS.md) | Route handlers |
| [frontend/components/](frontend/components/AGENTS.md) | React UI |
| [frontend/lib/](frontend/lib/AGENTS.md) | Domain logic |
| [scripts/](scripts/AGENTS.md) | Seed, validators |
| [supabase/](supabase/AGENTS.md) | Migrations, RLS |
| [.github/](.github/AGENTS.md) | CI |

Each folder also has **README.md** for human onboarding.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Lint fails on `let` / IIFE | Refactor to `const`, named function, or `chunkArray` pattern |
| Empty UI | Seed DB; env vars in `frontend/.env.local` |
| Types out of sync with DB | Update `lib/<domain>/types.ts` + migration in same PR |
| Investigation errors | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` and `LLM_PROVIDER` |
