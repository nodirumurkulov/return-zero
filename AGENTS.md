# AGENTS.md

Instructions for AI coding agents working in **return-zero** (Resolve). Humans: see [README.md](README.md).

## Project overview

Resolve is an ecommerce incident-response app for the Pretty Fly demo brand: detect KPI breaches, run AI investigation, approve fixes, monitor recovery.

| Area | Path | Stack |
|------|------|-------|
| Web app + API | `frontend/` | Next.js 16, React 19, Bun, Supabase Auth |
| Database | `frontend/supabase/` | Postgres migrations, RLS |
| Seed / validators | `frontend/scripts/` | Bun + `@supabase/supabase-js` |
| Long-form docs | `docs/` | Deployment, analytics |
| Hackathon | `hackathon/` | Pretty Fly CSVs, demo guides (not app code) |

**Closest `AGENTS.md` wins.** Read the file in the directory you edit, then parent files up to this root.

## Best practices mandate

**Default stance: idiomatic, current best practice — not “make it work with what’s there.”**

1. **No backward compatibility.** Do not keep deprecated APIs, re-exports, shims, feature flags, or “temporary” adapters so old call sites keep compiling. **Redesign, refactor, and delete** obsolete code in the same change; update every import and consumer.
2. **Follow stack idioms.** Match how this repo and the ecosystem expect code to look (Next.js App Router, React 19 RSC, domain `lib/`, Zod at boundaries, Postgres types in `types.ts`). If local code diverges from idioms, **fix the divergence** — do not add another layer on top.
3. **Use relevant agent skills by context.** When a task touches an area below, apply that area’s practices from installed skills (e.g. Next.js / React / Vercel / TypeScript / Postgres / modern JS) — not generic shortcuts.
4. **Smallest correct design.** Prefer clear domain modules, pure functions, and explicit types over clever one-offs. Extend existing modules before inventing parallel patterns.
5. **Leave the tree cleaner.** Touching a file is permission to bring it in line with these rules; scope stays proportional to the task, but **do not** preserve bad patterns “for later.”

| Context | Apply practices for |
|---------|---------------------|
| `frontend/app/` | Next.js App Router, RSC-first data loading, server actions |
| `frontend/app/api/` | Thin route handlers, Zod validation, no shared JSON helpers |
| `frontend/components/` | React composition, minimal client islands, a11y |
| `frontend/lib/` | Domain boundaries, DB-aligned types, functional style |
| `supabase/` | Migrations, RLS, Postgres schema design |
| `frontend/scripts/` | Bun CLI; `createClient()` from `@supabase/supabase-js` |
| Docs (`README.md`, `AGENTS.md`) | Clear prose; keep agent + human docs accurate |

Nested `AGENTS.md` files spell out **context-specific** rules; this section is the non-negotiable default everywhere.

## Setup commands

```bash
cp .env.example frontend/.env.local   # fill Supabase (URL, anon, service role), LLM keys
cd frontend && bun install
```

Apply DB migrations (Supabase CLI) before seeding. See [frontend/supabase/](frontend/supabase/) and [frontend/scripts/README.md](frontend/scripts/README.md).

```bash
cd frontend && bun run seed
```

## Development workflow

```bash
cd frontend && bun run dev          # http://localhost:3000
cd frontend && bun run check        # lint + typecheck
cd frontend && bun run build
cd frontend/supabase && supabase start && cd .. && bun run db:reset
```

Package manager: **Bun** in `frontend/` (app + scripts).

## Testing instructions

- **Unit:** `cd frontend && bun run check` (lint + typecheck).
- **E2E:** `supabase start`, then `bun run seed`, `bun run build`, `CI=true bun run e2e`. See [frontend/e2e/README.md](frontend/e2e/README.md).
- **CI:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — parallel lint/typecheck/build → Supabase → seed → Playwright.
- After schema or metrics changes: `cd frontend && bun run validate` against a seeded Supabase project.
- RLS: `cd frontend && bun run db:reset && bun run db:test:rls` (Supabase CLI).
- When adding behavior, prefer extending existing domain modules with clear types over ad-hoc route logic.

## Code style

- Prefer **`const`**. No **`let`** unless ESLint cannot be satisfied (rare). No **`var`**.
- No **IIFEs** for variable init (sync or async). Use a named function or inline `safeParse`. ESLint enforces via `no-restricted-syntax`.
- Prefer pure functions, `reduce`, and early returns over mutable index loops.
- **No backward compatibility** (see [Best practices mandate](#best-practices-mandate)): delete deprecated surfaces and fix all imports in the same PR.
- **Domain modules** under `frontend/lib/<domain>/`: types match Supabase columns, queries, mutations, Zod `schemas.ts`.
- Import from `@/lib/incidents`, `@/lib/catalog`, etc. Never re-export domain types from `components/`.
- **API JSON:** Zod in `lib/<domain>/schemas.ts`; routes use `schema.safeParse(await req.json().catch(...))` inline.
- **React:** Server Components fetch data; small `"use client"` islands for mutations; use `router.refresh()` after client mutations.
- JSX async handlers: `onClick={() => { void handler(); }}` for `no-misused-promises`.

Run before every PR:

```bash
cd frontend && bun run lint && bun run typecheck && bun run build
```

## Security

- Never put server secrets in `NEXT_PUBLIC_*` or client components.
- `SUPABASE_SERVICE_ROLE_KEY`, LLM keys, `SLACK_*`, `CRON_SECRET` are server-only.
- Use `await createClient()` from `@/lib/supabase/server` in RSC, server actions, and user APIs (RLS).
- Use `createAdminClient()` from `@/lib/supabase/admin` for cron routes, Slack webhook, and scripts only.
- Keep server secrets out of `"use client"` files and off `NEXT_PUBLIC_*` env vars.

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
| [frontend/scripts/](frontend/scripts/README.md) | Seed, validators |
| [frontend/supabase/](frontend/supabase/) | Migrations, RLS |
| [.github/](.github/AGENTS.md) | CI |

Each folder also has **README.md** for human onboarding.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Lint fails on `let` / IIFE | Refactor to `const`, named function, or `Array.from` batch slices |
| Empty UI | Seed DB; env vars in `frontend/.env.local` |
| Types out of sync with DB | Update `lib/<domain>/types.ts` + migration in same PR |
| Investigation errors | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` and `LLM_PROVIDER` |
