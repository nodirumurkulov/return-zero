# lib/catalog/

Product catalog metrics, KPI thresholds, and health scoring.

## Files

- `types.ts` — `ProductMetric`, `KpiThreshold`, … (**same shape as DB/views**)
- `health.ts` — `computeProductHealth`, `computeHealthLevel`
- `queries.ts` — `listCatalogWithThresholds`, `getProductCatalogDetail`
- `index.ts` — public exports

Pages call **queries** and use types from `types.ts` directly — no separate row types or mappers.
