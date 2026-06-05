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
| `analytics/` | Replay time-travel, orders feed |
| `incidents/` | Detection and incident lifecycle |

## Rules

- Import from `@/lib/stores` only.
- `MockStore` / `ShopifyStore` implement `Store` and dispatch to `connector` + `connections`.
- Connectors live in `connect/` — not here.
