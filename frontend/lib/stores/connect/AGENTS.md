# AGENTS.md — lib/stores/connect

Store connector implementations and connection orchestration. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `store-connector.ts` | `StoreConnector`, `LoadResult` |
| `store-connector.ts` | `StoreConnector`, `store_connections` types |
| `queries.ts` | Read/update `store_connections` |
| `setup.ts` | `connectStore` orchestration |
| `intelligence/` | Baseline learn + business report + replay cursor reset |
| `loaders/csv.ts` | Shared type-safe CSV/JSON parse + batched upsert |
| `mock/` | Pretty Fly demo (`mock_csv` platform) |
| `shopify/` | Shopify connector (stub) |

## Rules

- Each platform class implements `StoreConnector` from `./store-connector`.
- Public exports live on `@/lib/stores` (`index.ts`), not here.
- `mock/pack.ts` is server-only (reads `hackathon/data-pack/data`).
