# lib/catalog/

Product catalog metrics, KPI thresholds, and health scoring.

## Files

- `db.ts` — Supabase row shapes
- `types.ts` — app-facing metric/threshold types
- `health.ts` — `computeProductHealth`, `computeHealthLevel`
- `queries.ts` — `listCatalogWithThresholds`, `getProductCatalogDetail`
- `index.ts` — public exports

Pages should call **queries** instead of casting Supabase `data` with `as`.

Replaces former `types/database.ts` catalog section.
