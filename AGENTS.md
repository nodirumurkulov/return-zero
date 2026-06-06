# AGENTS.md

Instructions for AI coding agents working in **return-zero** (Hugo). Humans: see [README.md](README.md).

## Project overview

Hugo is an ecommerce incident-response app backed by the Hugo mock store demo dataset: detect KPI breaches, run AI investigation, approve fixes, monitor recovery.

| Area | Path | Stack |
|------|------|-------|
| Web app + API | `frontend/` | Next.js 16, React 19, Bun, Supabase Auth |
| Database | `frontend/supabase/` | Postgres migrations, RLS |
| Seed / validators | `frontend/scripts/` | Bun + `@supabase/supabase-js` |
| Long-form docs | `docs/` | Deployment, analytics |
| Hackathon | `hackathon/` | Mock store CSVs, demo guides (not app code) |

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

**Cursor rules:** [`.cursor/rules/`](.cursor/rules/) — file-scoped standards (TypeScript, Next.js, Supabase, API, React, testing). Quality audit runbook: [docs/quality-audit-checklist.md](docs/quality-audit-checklist.md).

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

- **Unit:** `cd frontend && bun run test` (Vitest + React Testing Library; co-located `*.test.tsx`).
- **E2E:** `supabase start`, then `bun run seed`, `bun run build`, `CI=true bun run e2e`. See [frontend/e2e/README.md](frontend/e2e/README.md).
- **CI:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — parallel lint/typecheck/test/build → Supabase → seed → Playwright.
- After schema or metrics changes: `cd frontend && bun run validate` against a seeded Supabase project.
- RLS: `cd frontend && bun run db:reset && bun run db:test:rls` (Supabase CLI).
- When adding behavior, prefer extending existing domain modules with clear types over ad-hoc route logic.

## Code style

- Prefer **`const`**. No **`let`** unless ESLint cannot be satisfied (rare). No **`var`**. Use `tryRequireOrganizationId()` or early returns instead of `try/catch` + `let`.
- **No Supabase escape hatches.** Use `supabase.from("table")` and `supabase.rpc(...)` with `SupabaseClient<Database>` — never wrappers that cast `from()` to `Record<string, unknown>`, loose table-name strings, or “row value” coercers. If types are stale, run `bun run db:types` and fix `database.types.ts` in the same PR.
- No **IIFEs** for variable init (sync or async). Use a named function or inline `safeParse`. ESLint enforces via `no-restricted-syntax`.
- Prefer pure functions, `reduce`, and early returns over mutable index loops.
- **No backward compatibility** (see [Best practices mandate](#best-practices-mandate)): delete deprecated surfaces and fix all imports in the same PR.
- **Domain modules** under `frontend/lib/<domain>/`: types match Supabase columns, queries, mutations, Zod `schemas.ts`.
- Import from `@/lib/stores/incidents`, `@/lib/stores/analytics/catalog`, etc. Never re-export domain types from `components/`.
- **API JSON:** Zod in `lib/<domain>/schemas.ts`; routes use `schema.safeParse(await req.json().catch(...))` inline.
- **No trivial utility wrappers.** Do not add single-function files or exported helpers whose only job is a few lines of validation, coercion, or renaming that belongs at the call site. Validate at boundaries with Zod (`safeParse` inline in server actions, route handlers, API routes). Narrow types at parse time (e.g. `z.string().startsWith("/").refine(...)`) instead of widening to `FormDataEntryValue`, `unknown`, or `string` and “fixing” in a helper. Put shared schemas in `lib/<domain>/schemas.ts` only when **two or more** modules need the same shape; delete wrapper files and update all imports in the same change.

  ```typescript
  // Bad — lib/auth/redirect.ts wrapper
  redirect(safeRedirectPath(formData.get("next")));

  // Good — shared schema, parse at boundary
  const nextParsed = authNextPathSchema.safeParse(formData.get("next"));
  redirect(nextParsed.success ? nextParsed.data : AUTH_NEXT_DEFAULT);
  ```

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
| Types out of sync with DB | Run `bun run db:types`; update domain types + migration — do not add `from-table` shims |
| Investigation errors | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` and `LLM_PROVIDER` |

## Cursor Cloud specific instructions

**One-time VM bootstrap** (not in the update script): install Bun 1.3.14+, Docker CE (fuse-overlayfs storage driver), and Supabase CLI v2.105.0 from the [GitHub release tarball](https://github.com/supabase/cli/releases) into `$HOME/.local/share/supabase` (extract the full tarball — do not copy only the `supabase` shim). Add `$HOME/.local/share/supabase` and `$HOME/.bun/bin` to `PATH`. Add the `ubuntu` user to the `docker` group, or wrap Docker commands in `sg docker -c "…"`.

**First-time app bootstrap:**

```bash
cp .env.example frontend/.env.local
cd frontend/supabase && sg docker -c "supabase start --exclude studio,imgproxy,mailpit,edge-runtime" && cd ..
eval "$(cd frontend/supabase && sg docker -c 'supabase status -o env')"
# Paste API_URL, ANON_KEY, SERVICE_ROLE_KEY into frontend/.env.local
cd frontend && bun run db:reset && bun run seed
```

Demo login uses `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` from `.env.example` (defaults: `demo@example.test` / `change-me`). LLM keys are optional for catalog/incidents browsing; set real `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for investigation.

**Starting services** (each new session — Supabase does not auto-start):

```bash
cd frontend/supabase && sg docker -c "supabase start --exclude studio,imgproxy,mailpit,edge-runtime"
cd frontend && bun run dev   # http://localhost:3000
```

Ports: app **3000**, Supabase API **54321**, Postgres **54322**.

**Quality checks** (see [Testing instructions](#testing-instructions)): `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run validate` (needs seeded DB).
