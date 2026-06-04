# components/catalog/

Product catalog UI: grid, product card, health badge, KPI cards, threshold editor.

## Types

Use `@/lib/catalog` for `ProductMetric`, `KpiThreshold`, `HealthLevel`, and `computeProductHealth`.

## Data flow

Server pages load metrics/thresholds; pass props into `CatalogGrid` and `ProductCatalogCard`. `ThresholdEditor` calls server action `updateThreshold`.
