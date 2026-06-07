# AGENTS.md — lib/stores/connection

Store connect/sync domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `connection.ts` | `StoreConnectionDomain` — snapshot, connect, list, connectShopify |
| `sync.ts` | Background sync orchestration (`mock_csv`, `shopify`) |
| `schemas.ts` | Connection Zod schemas |

Shopify OAuth, Admin API, and secrets live in [`lib/shopify/`](../../shopify/AGENTS.md). Import from `@/lib/shopify/server`.

## Public API

```typescript
import { getStore } from "@/lib/stores/server";

const { connection } = getStore(supabase);
await connection.list({ organizationId });
await connection.snapshot({ scope });
await connection.connect({ scope, platform });
await connection.connectShopify({
  organizationId,
  externalShopId,
  label,
  accessToken,
  scopes,
  activateStore, // optional — force active_store_id
});
```

`connectShopify` uses the **admin** Supabase client (RLS is read-only on `store_connections`). Wired on the `Store` facade as `store.connection`.

## OAuth callback flow

`GET /api/shopify/callback` runs through [`lib/shopify/oauth-flow.ts`](../../shopify/oauth-flow.ts) (`ShopifyOAuth.completeOAuth`), which calls `connectShopify` then queues `store.import.runBackgroundImport({ platform: "shopify" })` via `after()`.
