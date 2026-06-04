# UI primitives

shadcn/ui components (`radix-nova` style) plus thin Resolve wrappers. No business rules, Supabase, or domain types.

## Adding components

From `frontend/`:

```bash
bunx shadcn@latest add <component> -y
```

Use `-o` to refresh an existing file. Config: [`components.json`](../components.json).

## What's here

**CLI primitives:** `Button`, `Card`, `Input`, `Badge`, `Label`, `Alert`, `Empty`, `Separator`, `Sidebar`, `Sheet`, `Tooltip`, `Skeleton`, `DropdownMenu`, `Avatar`, `Collapsible`.

**Resolve wrappers:** `SeverityBadge`, `StatusBadge`, `ImpactTag`, `EmptyState`, `SectionLabel`, `Sparkline` (custom chart).

## Usage

```tsx
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/empty-state";
```

Feature components in `catalog/` and `incidents/` compose these primitives.

## Notes

- Prefer adding generic styling here; keep KPI/incident logic in feature folders.
- Domain badges map string enums to `Badge` class names only.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
