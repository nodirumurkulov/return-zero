# AGENTS.md — lib/stores/analytics

Store analytics: source domains, KPI engine, catalog, forecast, search, replay. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Import | Role |
|------|--------|------|
| `sources/` | — | Ecommerce source domain slices (commerce, marketing, support, …) |
| `metrics/` | `@/lib/stores/analytics/metrics` | KPI engine, series, source facts |
| `catalog/` | `@/lib/stores/analytics/catalog` | Product metrics, thresholds, health |
| `forecast/` | `@/lib/stores/analytics/forecast` | Deterministic forecasts |
| `search/` | `@/lib/stores/analytics/search` | Global search targets |
| `replay/` | `@/lib/stores/analytics/replay` | Time-travel cursor + orders feed |
| `learn/` | `@/lib/stores/analytics/learn` | Post-connect baselines + business report |

## API routes

| Route | Module |
|-------|--------|
| `POST /api/stores/analytics/replay` | `replay/` |
| `GET /api/stores/analytics/replay/orders` | `replay/feed/` |
| `POST /api/learn` | `learn/` |
