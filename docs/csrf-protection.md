# CSRF Protection

Cross-Site Request Forgery defense implemented in `frontend/lib/csrf.ts`, enforced in `frontend/proxy.ts` middleware.

## The attack

CSRF exploits the browser's automatic cookie-sending behavior. If a user is logged into our app (has a valid Supabase session cookie), a malicious site can craft a hidden form that submits to our API:

```html
<!-- On evil.com -->
<form action="https://our-app.vercel.app/api/stores/incidents/123/approve"
      method="POST" id="pwn">
  <input type="hidden" name="payload" value='{"action_ids":["malicious"]}' />
</form>
<script>document.getElementById('pwn').submit()</script>
```

The browser sends the cookie automatically → our server sees an authenticated request → the action executes. The attacker never sees the response (same-origin policy blocks that), but the damage (approve, delete, modify) is done.

## The defense: Origin header verification

Modern browsers attach an `Origin` header to every cross-origin request and to same-origin state-changing requests (POST, PUT, PATCH, DELETE). We verify this header matches our app's URL.

```
Browser → POST /api/stores/incidents/123/approve
          Origin: https://evil.com         ← set by browser, cannot be spoofed
          Cookie: sb-xxx=...               ← auto-attached

Middleware → Origin "evil.com" ≠ allowed "our-app.vercel.app" → 403 Forbidden
```

### Why this works

1. **Browsers enforce Origin headers** — JavaScript cannot override the `Origin` header on a cross-origin request. It's a "forbidden" header controlled by the browser.
2. **Same-origin requests pass** — when the user clicks a button in our app, `Origin` matches `NEXT_PUBLIC_APP_URL`.
3. **No tokens needed** — unlike CSRF-token patterns, Origin checking is stateless. No token generation, storage, or synchronization.

### Fallback: Referer header

If `Origin` is missing (rare — some corporate proxies strip it), we check the `Referer` header's origin component. If neither is present on a mutating request, we reject it.

## What is checked

| Condition | Result |
|-----------|--------|
| GET / HEAD / OPTIONS | Always allowed (safe methods) |
| Non-`/api/` paths | Always allowed (page navigations) |
| CSRF-exempt routes (see below) | Always allowed |
| POST/PUT/PATCH/DELETE to `/api/*` with matching Origin | Allowed |
| POST/PUT/PATCH/DELETE to `/api/*` with mismatched Origin | **403 Forbidden** |
| POST/PUT/PATCH/DELETE to `/api/*` with no Origin + matching Referer | Allowed |
| POST/PUT/PATCH/DELETE to `/api/*` with no Origin + no Referer | **403 Forbidden** |

## Exempt routes

These routes use their own authentication and don't rely on session cookies:

| Prefix | Auth mechanism | Why exempt |
|--------|---------------|------------|
| `/api/slack/*` | HMAC signature (`SLACK_SIGNING_SECRET`) | Slack sends requests from its own servers |
| `/api/waitlist*` | Public or token-based | No session cookie, no CSRF risk |
| `/api/shopify/*` | OAuth flow | Shopify callback from external origin |
| `/api/digest` | Cron secret (`CRON_SECRET`) | Vercel Cron, no cookie |

## Protected routes

All session-authenticated mutating endpoints:

- `POST /api/investigate` — trigger AI investigation
- `POST /api/stores/incidents/[id]/approve` — approve incident actions
- `PATCH /api/stores/incidents/[id]` — update incident status
- `PATCH /api/stores/catalog/[productId]/threshold` — update KPI threshold
- `PATCH /api/stores/active` — switch active store
- `POST /api/stores/import/[platform]` — import platform data
- `POST /api/stores/incidents/detect` — run detection (user mode)
- `POST /api/stores/orders/advance` — advance orders (user mode)

## Future improvements

1. **Double-submit cookie** — for defense-in-depth, generate a random CSRF token in the session cookie and require it as a request header. This adds a second layer if Origin checking is somehow bypassed.
2. **SameSite=Strict cookies** — configure Supabase Auth to use `SameSite=Strict` on the session cookie. This prevents the cookie from being sent on cross-site requests at all, but may break OAuth redirects.
3. **Custom header requirement** — require a custom `X-Requested-With` header on API calls. Simple forms cannot set custom headers, adding another CSRF barrier.
