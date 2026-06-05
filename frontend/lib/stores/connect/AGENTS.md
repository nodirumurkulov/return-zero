# AGENTS.md — lib/stores/connect

Store connector implementations. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `StoreConnector`, registry, `connectStore`, `store_connections` helpers |
| `loaders/csv.ts` | Shared CSV/JSON parse + batched upsert |
| `mock/` | Pretty Fly demo (`mock_csv` platform) |
| `shopify/` | Shopify connector (stub) |

## Rules

- Each platform class implements `StoreConnector` from `./index.ts`.
- Public exports live on `@/lib/stores`.
- `mock/pack.ts` is server-only (reads `hackathon/data-pack/data`).
