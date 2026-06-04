# AGENTS.md — lib/catalog

Catalog metrics, thresholds, health. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `types.ts` | `ProductMetric`, `KpiThreshold`, `ProductMonthlyMetric` |
| `queries.ts` | `listCatalogWithThresholds`, `getProductCatalogDetail` |
| `health.ts` | `computeProductHealth`, `computeHealthLevel` |
| `index.ts` | Public exports |

## Best practices

- Health and threshold logic stay here — **redesign** catalog pages to use queries rather than inlining Supabase or legacy shapes.

## Rules

- Pages call **queries** — do not cast raw Supabase rows in `app/catalog/*`.
- Threshold updates go through `app/actions.ts` (`updateThreshold`).
