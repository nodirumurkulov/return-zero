# AGENTS.md — lib/stores/connect

Store connector implementations. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `StoreConnector` types |
| `schemas.ts` | Connect API response Zod schemas |
| `mock.ts` | `MockStoreConnector` |
| `shopify.ts` | `ShopifyStoreConnector` (stub) |
| `loaders/csv.ts` | Shared CSV/JSON parse + batched upsert |
| `mock/` | Pretty Fly pack, rows, id-maps |

## Rules

- Connectors implement `load` only.
- `Store` and platform stores live in `../mock.ts` and `../shopify.ts`.
- Not imported directly — use `@/lib/stores`.
