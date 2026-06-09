# Shopify OAuth Security Audit

Security review of the Shopify OAuth integration (`lib/shopify/`).

## Flow overview

```
Browser                     return-zero                   Shopify
  │                             │                            │
  ├─ GET /api/shopify/auth ────►│                            │
  │   ?shop=demo&intent=login   │                            │
  │                             │── Zod validates shop ──►   │
  │                             │── signs state cookie ──►   │
  │◄── 302 + Set-Cookie ───────│                            │
  │    (shopify_oauth_state)    │                            │
  │                             │                            │
  ├─────────────── 302 to Shopify authorize ────────────────►│
  │                             │                            │
  │◄──────────────── 302 + code + hmac + state ─────────────│
  │                             │                            │
  ├─ GET /api/shopify/callback ►│                            │
  │   ?code=...&hmac=...&state= │── verify HMAC ──────────►  │
  │                             │── compare state cookie ──► │
  │                             │── exchange code for token ►│
  │                             │◄── access_token ──────────│
  │                             │── store token (admin) ──►  │
  │◄── 302 /onboarding ────────│                            │
```

## Findings

### 1. State validation — PASS

**What it does**: The OAuth state is a HMAC-SHA256 signed cookie containing `{ shop, nonce, intent, returnTo }`.

```typescript
// state.ts — signOAuthState
const body = Buffer.from(JSON.stringify(parsed.data)).toString("base64url");
return `${signPayload(body, secret)}.${body}`;
```

**Verification on callback (`oauth-flow.ts:166-173`)**:

```typescript
if (!stateCookie || stateCookie !== query.state) {
  return { action: "error", message: "Invalid OAuth state", status: 400 };
}
const statePayload = parseOAuthState(stateCookie, this.apiSecret);
if (!statePayload || statePayload.shop !== query.shop) {
  return { action: "error", message: "Invalid OAuth state", status: 400 };
}
```

**Security properties**:
- State is HMAC-signed with `SHOPIFY_API_SECRET` — cannot be forged
- Uses `timingSafeEqual` for signature comparison — no timing side-channel
- State cookie is `httpOnly`, `sameSite: lax`, `secure` in production
- Nonce is `randomUUID()` — sufficient entropy (122-bit)
- Cookie `maxAge: 600` (10 minutes) — limits replay window
- State includes `shop` — verified against callback `shop` parameter (prevents shop-swap attacks)

**Recommendation**: None — state validation is well-implemented.

---

### 2. HMAC verification — PASS

**What it does**: Shopify appends an HMAC to the callback URL, signed with the app's API secret. This proves the callback originated from Shopify.

```typescript
// oauth.ts
export async function verifyOAuthHmac(query) {
  return await getShopifyApi().utils.validateHmac(authQuery);
}
```

Delegates to `@shopify/shopify-api` SDK, which computes `HMAC-SHA256(sorted_params, api_secret)` and compares. The SDK uses constant-time comparison internally.

**Callback flow (`oauth-flow.ts:161-163`)**:
```typescript
const hmacValid = await verifyOAuthHmac(query);
if (!hmacValid) {
  return { action: "error", message: "Invalid OAuth signature", status: 403 };
}
```

HMAC is verified **before** state parsing, token exchange, or any side effects.

**Recommendation**: None — correctly implemented.

---

### 3. Callback URL construction — PASS (with note)

```typescript
// auth/route.ts
function shopifyCallbackUrl(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  return `${appUrl.replace(/\/$/, "")}/api/shopify/callback`;
}
```

The callback URL is constructed from `NEXT_PUBLIC_APP_URL` (or request origin fallback), NOT from user input. This means an attacker cannot manipulate the callback URL to redirect the OAuth code to a malicious server.

**Note**: The callback URL is not registered/validated on Shopify's side at the code level. Shopify validates it against the app's "Allowed redirection URL(s)" in the Shopify Partner Dashboard. Ensure the Dashboard only lists the production and staging URLs.

**Recommendation**: Document in `.env.example` that `NEXT_PUBLIC_APP_URL` must match the Shopify app's Allowed Redirection URL.

---

### 4. Token storage — PASS

```typescript
// secrets.ts — service-role only
export async function upsertStoreSecret(storeId, accessToken, scopes) {
  const supabase = createAdminClient(); // service_role
  await supabase.from("store_connection_secrets").upsert({...});
}
```

**Security properties**:
- Table `store_connection_secrets` has RLS enabled with NO policies for `authenticated` or `anon`
- Additionally, `REVOKE ALL FROM anon, authenticated` — double protection
- Only `service_role` can read/write — verified by Phase 3B RLS pentest
- Access token is stored as plaintext (not encrypted at rest beyond Postgres TDE)

**Recommendation (Medium)**: Consider encrypting `access_token` at the application layer before storing. If the database is compromised, plaintext tokens allow full API access to merchants' stores. Use AES-256-GCM with a key stored in a separate secret management system.

---

### 5. Input validation — PASS

All inputs are Zod-validated at the boundary:

| Input | Schema | Validates |
|-------|--------|-----------|
| `shop` (auth) | `shopifyShopInputSchema` | `^[a-zA-Z0-9][a-zA-Z0-9-]*$` or `*.myshopify.com` |
| `intent` | `shopifyOAuthIntentSchema` | Enum: `"login"` or `"connect"` only |
| `returnTo` | `authNextPathSchema` | Must start with `/`, no `//` (blocks open redirect) |
| Callback query | `shopifyOAuthCallbackQuerySchema` | `code`, `hmac`, `shop` (*.myshopify.com), `state` all required |

The `shop` validation is important: it prevents injection attacks where an attacker supplies a non-Shopify domain to redirect the OAuth flow to a malicious server. The regex requires `*.myshopify.com` format.

**Recommendation**: None — comprehensive validation.

---

### 6. Intent authorization — PASS

```typescript
// oauth-flow.ts:117-123
if (intent === "connect" && !opts.sessionUserId) {
  return { action: "redirect", url: `/sign-in?next=...` };
}
```

- `intent=connect` requires an authenticated session — prevents unauthenticated users from connecting stores to arbitrary orgs
- `intent=login` is allowed without session (it creates/bootstraps user + org)

**Recommendation**: None — correct authorization check.

---

### 7. Open redirect prevention — PASS

```typescript
// redirect.ts
const safeReturnTo =
  opts.returnTo != null && authNextPathSchema.safeParse(opts.returnTo).success
    ? opts.returnTo
    : undefined;
```

```typescript
// auth/schemas.ts
export const authNextPathSchema = z
  .string()
  .startsWith("/")
  .refine((path) => !path.startsWith("//"), "Protocol-relative URLs are not allowed");
```

`returnTo` is validated at:
1. **Auth route entry** — `shopifyAuthQuerySchema` includes `authNextPathSchema`
2. **State cookie creation** — `shopifyOAuthStatePayloadSchema` includes `authNextPathSchema`
3. **Redirect resolution** — `resolveOAuthRedirect` re-validates before redirecting

Triple validation ensures `returnTo` is always a relative path — no open redirect to `https://evil.com` or `//evil.com`.

**Recommendation**: None — well-defended.

---

### 8. Session establishment (login intent) — PASS (with note)

```typescript
// session.ts
export async function establishSessionForEmail(admin, routeClient, email) {
  const { data } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  await routeClient.auth.verifyOtp({ type: "email", token_hash: tokenHash });
}
```

For `intent=login`, the flow creates a Supabase session by:
1. Generating a magic link via admin API (server-side, no email sent)
2. Immediately verifying the OTP on the route-handler client (sets cookies on response)

This is a server-side session bootstrap — the magic link token never leaves the server. It's used solely to establish session cookies on the HTTP response.

**Note**: This relies on `SHOPIFY_API_SECRET` + Shopify HMAC being the authentication proof. The chain of trust is: Shopify verifies the merchant → HMAC proves callback is legitimate → server bootstraps session. If `SHOPIFY_API_SECRET` leaks, an attacker could forge the entire flow.

**Recommendation**: Ensure `SHOPIFY_API_SECRET` rotation procedures exist (see `docs/secrets-policy.md`).

---

### 9. Race condition on user/org creation — LOW RISK

```typescript
// identity.ts
const userId = await ensureShopOwnerUser(supabase, shopInfo.email);
const organizationId = await ensureShopOwnerOrg(supabase, userId, shopInfo.name);
```

`ensureShopOwnerUser` does CREATE → check existing on conflict. `ensureShopOwnerOrg` does SELECT existing → CREATE if none. Two concurrent OAuth callbacks for the same shop could create duplicate organizations.

**Mitigation**: `ON CONFLICT DO NOTHING` and unique constraints on `organization_members(organization_id, user_id)` prevent duplicate memberships. The `findOrganizationByShopDomain` check in `resolveShopLoginUser` finds existing orgs first.

**Residual risk**: Low — duplicate orgs are theoretically possible but unlikely in practice (two simultaneous first-time logins for the same shop). No data loss or security impact.

---

### 10. Background import authorization — PASS

```typescript
opts.scheduleBackgroundSync(async () => {
  await store.import.runBackgroundImport({ scope, platform: "shopify", replace: false });
});
```

The import runs with the admin client (service-role) that was already instantiated in the callback handler. The `scope` (organizationId + storeId) is derived from the verified OAuth flow, not from user input. The `after()` function schedules it as a Next.js background task.

**Recommendation**: None — scope is correctly derived.

---

## Summary

| Area | Status | Risk |
|------|--------|------|
| State validation (CSRF) | PASS | None |
| HMAC verification | PASS | None |
| Callback URL allowlisting | PASS | Low (dashboard config) |
| Token storage | PASS | Medium (plaintext) |
| Input validation (Zod) | PASS | None |
| Intent authorization | PASS | None |
| Open redirect prevention | PASS | None |
| Session establishment | PASS | Low (secret dependency) |
| Race condition | PASS | Low |
| Background import scope | PASS | None |

## Recommendations (prioritized)

1. **Medium**: Encrypt `access_token` at rest in `store_connection_secrets` (application-layer AES-256-GCM)
2. **Low**: Document Shopify Partner Dashboard callback URL allowlist in `.env.example`
3. **Low**: Add `SHOPIFY_API_SECRET` to rotation schedule in secrets policy
4. **Low**: Consider adding a unique constraint on `store_connections(organization_id, external_shop_id)` to prevent duplicate store connections from race conditions
