# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `Store`, `getStore`, re-exports from `connect/` |
| `connect/store-connector.ts` | `StoreConnector`, `LoadResult` |
| `connect/` | Platform connectors (`mock/`, `shopify/`), setup, queries, intelligence |
| `analytics/` | Replay time-travel, orders feed |

## Rules

- Import from `@/lib/stores` only — not `@/lib/stores/connect`.
- `StoreConnector` lives in `connect/store-connector.ts`; each platform implements it; `index.ts` wraps with `Store` (`{ connector }`).
- Platform code owns `store_connections`; replay cursor writes go through `stores/analytics/replay/cursor.ts`.
