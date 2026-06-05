# Catalog domain

Product catalog metrics, per-KPI thresholds, and health scoring (`healthy` / `warning` / `critical`).

## What's here

| File | Purpose |
|------|---------|
| `types.ts` | `ProductMetric`, `KpiThreshold`, `ProductMonthlyMetric` |
| `queries.ts` | `listCatalogWithThresholds`, `getProductCatalogDetail` |
| `health.ts` | `computeProductHealth`, `computeHealthLevel` |

## Usage

```typescript
import {
  computeProductHealth,
  listCatalogWithThresholds,
  type ProductMetric,
} from "@/lib/stores/analytics/catalog";
```

Catalog pages should call **queries** instead of casting raw Supabase rows.

## Notes

- Replaces the old monolithic `types/database.ts` catalog section.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
