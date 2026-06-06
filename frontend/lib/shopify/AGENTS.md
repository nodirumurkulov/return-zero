# AGENTS.md — lib/shopify

Shopify integration via [`@shopify/shopify-api`](https://github.com/Shopify/shopify-api-js). **Parent:** [../AGENTS.md](../AGENTS.md)

Store domains (`stores/connection/`, `stores/import/shopify.ts`) import from here — do not duplicate OAuth or Admin API logic under `stores/`.

## Layout

| File | Role |
|------|------|
| `config.ts` | `getShopifyApi()` singleton (`shopifyApi`, Node adapter) |
| `schemas.ts` | Zod: shop domain, OAuth state, callback query, token response |
| `shop.ts` | `normalizeShop` via `shopify.utils.sanitizeShop` |
| `oauth.ts` | Authorize URL, `verifyOAuthHmac`, token exchange, `auth.begin` / `auth.callback` wrappers |
| `state.ts` | Hugo-specific signed state cookie (`returnTo` — not in SDK) |
| `shop-info.ts` | `fetchShopInfo` via REST `/shop.json` |
| `client.ts` | `createShopifyAdminClient` → SDK `Graphql` + `Rest` clients |
| `secrets.ts` | Read/write `store_connection_secrets` via `createAdminClient()` |
| `errors.ts` | `ShopifyError` |
| `index.ts` | Pure exports: schemas, state, errors |
| `server.ts` | Server barrel: oauth, shop, client, secrets, `getShopifyApi` |

## Imports

```typescript
import { shopifyOAuthCallbackQuerySchema } from "@/lib/shopify";
import {
  buildAuthorizeUrl,
  createShopifyAdminClient,
  exchangeCodeForToken,
  fetchShopInfo,
  upsertStoreSecret,
  verifyOAuthHmac,
} from "@/lib/shopify/server";
```

**Next.js App Router:** use `buildAuthorizeUrl` + `state.ts` cookie helpers + `verifyOAuthHmac` / `exchangeCodeForToken` in route handlers. The SDK `auth.begin` / `auth.callback` wrappers expect Node `IncomingMessage` / `ServerResponse`, not `NextRequest` / `NextResponse`.

## OAuth routes

- `GET /api/shopify/auth` — signed state cookie → redirect to Shopify authorize URL
- `GET /api/shopify/callback` — HMAC + state → token → `fetchShopInfo` → `StoreConnectionDomain.connectShopify`
- Both paths are in [`PUBLIC_PREFIXES`](../../proxy.ts)

## Env

```
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_products,read_orders,read_customers,read_inventory
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Server-only — never `NEXT_PUBLIC_*` for secrets. `hostName` for OAuth redirects is derived from `NEXT_PUBLIC_APP_URL`.
