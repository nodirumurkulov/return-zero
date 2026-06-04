# Agent guide — return-zero (Resolve)

Read this file (and nested `agents.md` in the folder you are editing) before changing code.

## Product

Resolve is an ecommerce incident-response app: detect KPI breaches, open incidents, run AI investigation, approve fixes, monitor recovery. The app lives in `frontend/` (Next.js 16, Bun, Supabase, Clerk).

## Code style (required)

- Prefer **`const`**. Do not use `let` unless ESLint cannot be satisfied another way (rare).
- Do not use **`var`**.
- Do not use **async IIFEs** or other clever wrappers to assign one constant (e.g. `const x = await (async () => ...)()`). Use a **named function** or a small helper in `lib/`.
- Prefer **pure functions**, `reduce`, and early returns over mutable loops.
- Use **domain modules** under `lib/<domain>/` for types, DB row shapes, mappers, and queries. Import from `@/lib/incidents`, `@/lib/catalog`, etc. — not from deleted `types/database.ts`.
- API JSON bodies: use helpers in `lib/api/` (later Zod in domain `schemas.ts`). Optional bodies must handle empty/invalid JSON without IIFEs.
- React: server components fetch data; keep `"use client"` islands small. Wrap async handlers in JSX as `() => { void fn(); }` when needed for lint.
- Run before PR: `cd frontend && bun run lint && bun run typecheck && bun run build`.

## Repo map

| Path | Role |
|------|------|
| `frontend/` | Application |
| `scripts/` | Node seed/validation (not Bun) |
| `supabase/` | SQL migrations, RLS tests |
| `docs/` | Human deployment/architecture notes |

## Linear

Deslop work is tracked under project **Epic: Codebase deslop** (RUN-71–RUN-77). Close duplicate issues (RUN-68/69/70) when superseded by merged PRs.

## Nested guides

Each major directory has its own `agents.md` with local rules and file map.
