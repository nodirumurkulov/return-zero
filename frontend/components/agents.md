# components/

Presentational and lightly interactive React UI. **No Supabase calls** — receive data via props from server pages.

## Structure

| Folder | Purpose |
|--------|---------|
| `catalog/` | Product grid, KPI cards, thresholds |
| `incidents/` | Kanban, cards, actions, timeline |
| `layout/` | App shell, nav |
| `ui/` | Primitives (buttons, badges, shadcn-style) |

## Rules

- Import domain types from `@/lib/incidents` or `@/lib/catalog`, not redefined duplicates.
- `"use client"` only when needed (forms, dropdowns, fetch mutations).
- Async click handlers: `onClick={() => { void handler(); }}` to satisfy `no-misused-promises`.

Subfolders have their own `agents.md` where non-trivial.
