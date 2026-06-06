# AGENTS.md — lib/stores/connection

Store connect/sync domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `connection.ts` | `StoreConnectionDomain` — snapshot, connect |
| `sync.ts` | Background sync orchestration (`mock_csv`, `shopify`) |
| `schemas.ts` | Connection Zod schemas |

Shopify OAuth, Admin API, and secrets live in [`lib/shopify/`](../../shopify/AGENTS.md). Import from `@/lib/shopify/server`.

## RUN-125 wiring

- Add `/api/shopify/auth` and `/api/shopify/callback` to [`PUBLIC_PREFIXES`](../../../proxy.ts).
- Callback: `verifyOAuthHmac` → `exchangeCodeForToken` → `upsertStoreSecret` → upsert `store_connections`.
