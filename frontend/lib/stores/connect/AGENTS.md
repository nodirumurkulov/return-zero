# AGENTS.md — lib/stores/connect

Store connectors load external commerce data into org-scoped contract tables. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `StoreConnector` interface, `storeConnectors` registry, public exports |
| `store-connection.ts` | `store_connections` table types |
| `loaders/csv.ts` | Shared type-safe CSV/JSON parse + batched upsert |
| `mock/` | Pretty Fly demo store (`mock_csv` platform) |
| `shopify/` | Shopify connector (stub) |

## Rules

- Each platform folder implements `StoreConnector` from `index.ts`.
- Shared CSV mechanics live in `loaders/csv.ts` — platform code owns row mapping only.
- `mock/pack.ts` is server-only (reads `hackathon/data-pack/data`).
- Import from `@/lib/stores/connect`; do not re-export from components.
