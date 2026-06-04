# UI primitives

Shared visual building blocks (shadcn-style). No business rules, Supabase, or domain types.

## What's here

Examples: `Button`, `Card`, `Input`, `SeverityBadge`, `StatusBadge`, `ImpactTag`, `Sparkline`, `EmptyState`, `SectionLabel`.

## Usage

```tsx
import { Button } from "@/components/ui/button";
import SeverityBadge from "@/components/ui/SeverityBadge";
```

Feature components in `catalog/` and `incidents/` compose these primitives.

## Notes

- Prefer adding generic styling here; keep KPI/incident logic in feature folders.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
