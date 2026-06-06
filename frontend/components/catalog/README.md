# Catalog components

UI for the product catalog: grid, KPI cards, health badges, and inline threshold editing.

## What's here

| Component | Purpose |
|-----------|---------|
| `CatalogGrid` | Product list with health summary |
| `ProductCatalogCard` | Single product tile |
| `KpiCard` | Metric value + optional sparkline |
| `HealthBadge` | `healthy` / `warning` / `critical` |
| `ThresholdEditor` | Edit KPI warning/critical values (server action) |

## Usage

Rendered from server pages that call `listCatalogWithThresholds` / `getProductCatalogDetail` in `@/lib/stores/analytics/catalog`.

Types: `ProductMetric`, `KpiThreshold`, `HealthLevel` from `@/lib/stores/analytics/catalog`.

## Notes

- Threshold saves go through `PATCH /api/catalog/[productId]/threshold` via `@/hooks/stores/analytics/catalog`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
