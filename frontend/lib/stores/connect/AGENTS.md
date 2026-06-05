# AGENTS.md — lib/stores/connect

Store platform implementations. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `Store`, `StoreConnector`, `StoreConnections` |
| `mock.ts` | `MockStore`, `MockStoreConnector` |
| `shopify.ts` | `ShopifyStore`, `ShopifyStoreConnector` (stub) |
| `loaders/csv.ts` | Shared CSV/JSON parse + batched upsert |
| `mock/` | Pretty Fly pack, rows, id-maps |

## Rules

- Platform stores implement `Store` and dispatch to `connector` + `connections`.
- Callers instantiate `new MockStore()` or `new ShopifyStore()` — no registry.
- Public API: `@/lib/stores`.
