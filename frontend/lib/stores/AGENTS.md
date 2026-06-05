# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | Re-exports `Store`, platform classes |
| `connect/` | Connectors and platform stores |
| `analytics/` | Replay time-travel, orders feed |
| `incidents/` | Detection and incident lifecycle |

## Rules

- Import from `@/lib/stores` only.
- Instantiate platform stores at the call site (`new MockStore()`, `new ShopifyStore()`).
