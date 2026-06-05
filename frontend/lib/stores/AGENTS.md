# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | Public exports (`Store`, connectors, connect schemas) |
| `store.ts` | `Store` interface, `StoreConnections` |
| `mock.ts` / `shopify.ts` | Platform `Store` implementations (class facades) |
| `connect/` | `StoreConnector` types, Zod schemas, CSV loaders |
| `analytics/` | Metrics, catalog, forecast, search, replay, learn |
| `analytics/metrics/` | KPI engine, SPC helpers (`spc.ts`), source facts |
| `analytics/catalog/` | Product metrics, thresholds, health |
| `analytics/forecast/` | Deterministic forecasts |
| `analytics/search/` | Global search targets |
| `analytics/replay/` | Replay cursor + orders feed (`Replay` class facade) |
| `analytics/learn/` | Post-connect baselines + business report |
| `incidents/` | Detection and lifecycle (`Incidents` class facade) |

## Facade conventions

- **Class facades** for multi-step stateful domains: `Incidents`, `Replay`, `MockStore`, `ShopifyStore`.
- **Function modules** for read/compute paths: `catalog`, `metrics`, `search`, `learn`, `forecast`.
- Client fetch helpers live in `frontend/hooks/<domain>/`; server query options in `lib/stores/<domain>/api/`.

## Rules

- Import from `@/lib/stores` or documented subdomain barrels only.
- `MockStore` / `ShopifyStore` delegate loads to `connect/` connectors.
- Pure math (SPC, KPI status) stays in `analytics/metrics/` — not under `incidents/`.
