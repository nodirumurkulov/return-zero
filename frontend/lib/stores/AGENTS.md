# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | Public exports |
| `store.ts` | `Store` interface, `StoreConnections` |
| `mock.ts` | `MockStore` |
| `shopify.ts` | `ShopifyStore` |
| `connect/` | `StoreConnector` types and platform connectors |
| `analytics/` | Metrics engine, source domains, catalog, forecast, search, replay |
| `analytics/metrics/` | KPI engine, series, source facts |
| `analytics/sources/` | Ecommerce source domain slices (commerce, marketing, …) |
| `analytics/catalog/` | Product metrics, thresholds, health |
| `analytics/forecast/` | Deterministic forecasts |
| `analytics/search/` | Global search targets |
| `incidents/` | Detection and incident lifecycle |

## Rules

- Import from `@/lib/stores` only.
- `MockStore` / `ShopifyStore` implement `Store` and dispatch to `connector` + `connections`.
- Connectors live in `connect/` — not here.
