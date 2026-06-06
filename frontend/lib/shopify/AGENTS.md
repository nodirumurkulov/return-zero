# AGENTS.md — lib/shopify

Shopify integration module via [`@shopify/shopify-api`](https://github.com/Shopify/shopify-api-js). **Parent:** [../AGENTS.md](../AGENTS.md)

**Not** on the `Store` facade — OAuth orchestration lives here; `stores/connection/` persists connections; `stores/import/shopify.ts` loads data.

## Layout

| File | Role |
|------|------|
| `oauth-flow.ts` | **`ShopifyOAuth`** — `beginOAuth`, `completeOAuth` (unified pipeline); `getShopifyOAuth(admin)` |
| `types.ts` | Flow types: intent, begin/complete opts + results |
| `schemas.ts` | Zod: shop input, callback query, token response, intent, auth query, state payload |
| `state.ts` | Signed OAuth state cookie (`intent`, `returnTo`, `shop`, `nonce`) |
| `identity.ts` | Internal: shop login user/org bootstrap |
| `session.ts` | Internal: `establishSessionForEmail` (generateLink + verifyOtp on route response) |
| `redirect.ts` | Internal: post-OAuth redirect path resolution |
| `oauth.ts` | Primitives: authorize URL, HMAC verify, token exchange |
| `config.ts` | `getShopifyApi()` singleton |
| `shop.ts` | `normalizeShop` |
| `shop-info.ts` | `fetchShopInfo` via REST `/shop.json` |
| `client.ts` | `createShopifyAdminClient` |
| `secrets.ts` | Read/write `store_connection_secrets` (service role) |
| `errors.ts` | `ShopifyError` |
| `index.ts` | Client-safe exports: schemas, types, errors, state helpers |
| `server.ts` | `getShopifyOAuth`, platform primitives, client, secrets |

## Imports

```typescript
import { shopifyOAuthIntentSchema, shopifyShopInputSchema } from "@/lib/shopify";
import {
  getShopifyOAuth,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  verifyOAuthHmac,
} from "@/lib/shopify/server";
```

## OAuth flow

- **`intent=login`** (sign-in): no session required; bootstraps user/org if new; establishes session cookies on callback response; connects store + queues import.
- **`intent=connect`** (onboarding): session required at `beginOAuth`; connects store for signed-in org.

Routes are thin — delegate to `getShopifyOAuth(createAdminClient())`. Session cookies on callback use `createRouteHandlerClient` from `@/lib/supabase/route-handler`.

**Next.js App Router:** use `buildAuthorizeUrl` + `state.ts` + `verifyOAuthHmac` / `exchangeCodeForToken`. SDK `auth.begin` / `auth.callback` wrappers expect Node `IncomingMessage` / `ServerResponse`, not `NextRequest` / `NextResponse`.

## OAuth routes

- `GET /api/shopify/auth` — intent gate → signed state cookie → Shopify authorize URL
- `GET /api/shopify/callback` — HMAC + state → `ShopifyOAuth.completeOAuth` → redirect
- Both in [`PUBLIC_PREFIXES`](../../proxy.ts)

## Env

```
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_products,read_orders,read_customers,read_inventory
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Server-only secrets — never `NEXT_PUBLIC_*` for API secret. `hostName` derived from `NEXT_PUBLIC_APP_URL`.
