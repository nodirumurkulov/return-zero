# Components

React UI grouped by product area. Components receive data via **props** from server pages; they do not call Supabase directly.

## What's here

| Folder | Used on | Role |
|--------|---------|------|
| [`catalog/`](catalog/) | `/catalog/*` | Grid, KPI cards, threshold editor |
| [`incidents/`](incidents/) | `/incidents/*` | Kanban, detail view, approvals |
| [`layout/`](layout/) | Authenticated layout | Shell, nav, sign-out |
| [`ui/`](ui/) | Everywhere | Buttons, badges, cards, inputs |

## Usage

Import domain **types** from `@/lib/<domain>`, not from sibling components:

```typescript
import type { Incident } from "@/lib/stores/incidents";
import IncidentCard from "@/components/incidents/IncidentCard";
```

After a mutation, client islands call `router.refresh()` so the parent server page re-fetches.

## Notes

- Do not re-export domain types from component files.
- Keep `"use client"` limited to interactivity (dropdowns, approve buttons, investigation trigger).

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
