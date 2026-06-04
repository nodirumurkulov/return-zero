# Agent guide — return-zero (Resolve)

Read this file (and nested `AGENTS.md` in the folder you are editing) before changing code.

## Product

Resolve is an ecommerce incident-response app: detect KPI breaches, open incidents, run AI investigation, approve fixes, monitor recovery. The app lives in `frontend/` (Next.js 16, Bun, Supabase, Clerk).

## Design philosophy

- **Prefer redesign and refactor over backward compatibility.** Do not keep deprecated exports, shim layers, or duplicate types “for old callers.” Update all imports and delete the old surface in the same change.
- **Domain modules own their API.** Import types and queries from `@/lib/<domain>` — never re-export domain types from `components/`.

## Code style (required)

- Prefer **`const`**. Do not use `let` unless ESLint cannot be satisfied another way (rare).
- Do not use **`var`**.
- Do not use **IIFEs** (sync or async) to initialize a variable — e.g. `const x = (() => ...)()` or `const x = await (async () => ...)()`. Use a **named function** at the bottom of the module or a domain helper. ESLint enforces this via `no-restricted-syntax`.
- Prefer **pure functions**, `reduce`, and early returns over mutable loops.
- Use **domain modules** under `lib/<domain>/` for types, DB row shapes, mappers, queries, and mutations. Import from `@/lib/incidents`, `@/lib/catalog`, etc. — not from deleted `types/database.ts`.
- **No generic `lib/api/read-json` helpers.** Parse JSON in the route with a small named function, or use Zod schemas in the domain module (RUN-73).
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

Each major directory has **`README.md`** (overview for humans) and **`AGENTS.md`** (rules and file map for agents). Read both for the folder you edit.
