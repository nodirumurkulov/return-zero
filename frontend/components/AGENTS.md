# AGENTS.md — components

React UI. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Scope

- **No Supabase calls** — data arrives via props from server pages.
- Import types from `@/lib/stores/incidents`, `@/lib/catalog`, etc.
- **Never re-export** domain types from component files.

## Structure

| Folder | AGENTS.md |
|--------|-----------|
| [catalog/](catalog/AGENTS.md) | Catalog grid, KPIs, thresholds |
| [incidents/](incidents/AGENTS.md) | Kanban, detail, approvals |
| [layout/](layout/AGENTS.md) | AppShell |
| [ui/](ui/AGENTS.md) | Primitives |

## Best practices (UI)

- **shadcn/ui first** — extend primitives under `ui/` via `bunx shadcn@latest add`; use thin wrappers for Resolve-specific badges and empty states.
- **Composition over props soup** — split components when booleans multiply; prefer children/slots over `isX` flags (React composition idioms).
- **No domain logic in UI** — health, severity, approval rules stay in `lib/`; components render and trigger actions only.
- **No backward compat props** — rename/remove props and update all call sites; do not keep optional deprecated props.
- **Accessibility:** labels, focus, and keyboard paths on interactive controls (especially approve/investigate flows).

## Code style

- `"use client"` only when needed (dropdowns, approve, investigation button).
- After mutations: `router.refresh()` (see `ActionList`, `TriggerInvestigationButton`).
- Async clicks: `onClick={() => { void handler(); }}`.

## Testing

Co-located unit tests: `ComponentName.test.tsx` next to each component.

```bash
cd frontend && bun run test
cd frontend && bun run check
```

Fixtures: `frontend/test/fixtures/`. Shared mocks: `frontend/test/mocks/`, `vitest.setup.ts`.
