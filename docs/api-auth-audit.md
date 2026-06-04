# API Route Auth & Error-Response Audit (RUN-31)

Audit of every `/api/*` route handler in `frontend/app/api/`: what enforces auth,
whether the route mutates data, and what unauthenticated callers receive.

## How auth is enforced

All routes are gated by Clerk in `frontend/middleware.ts`. The matcher runs the
middleware on every request except Next internals/static assets, and explicitly on
`/(api|trpc)(.*)`. Only `/sign-in` and `/sign-up` are public.

As of this change, unauthenticated `/api/*` requests get a **consistent JSON `401`**
(`{"error":"Unauthorized"}`) instead of Clerk's default HTML 404/redirect. Page routes
still redirect unauthenticated users to `/sign-in`.

## Route inventory

| Route | Methods | Mutates? | Auth mechanism | Unauth response |
|-------|---------|----------|----------------|-----------------|
| `/api/incidents` | GET | no | Clerk middleware | `401 {"error":"Unauthorized"}` |
| `/api/incidents/[id]` | GET, PATCH | PATCH yes | Clerk middleware | `401` |
| `/api/incidents/[id]/approve` | POST | yes | Clerk middleware | `401` |
| `/api/investigate` | POST | yes | Clerk middleware | `401` |
| `/api/slack/webhook` | POST | yes | Clerk middleware ⚠ | `401` (see F2) |

## In-route error responses (input validation)

| Route | Validation errors |
|-------|-------------------|
| `/api/incidents` GET | `500` on DB error |
| `/api/incidents/[id]` GET | `404` when incident missing |
| `/api/incidents/[id]` PATCH | `500` on DB error |
| `/api/incidents/[id]/approve` POST | `400` "No actions to approve"; `500` on DB error |
| `/api/investigate` POST | `400` missing `incident_id`/`product_id`; `500` on failure |
| `/api/slack/webhook` POST | `400` missing/invalid `payload` |

## Manual test (unauthenticated, no Clerk session)

```
# Before (this PR)                 # After (this PR)
GET    /api/incidents      -> 404  GET    /api/incidents      -> 401 {"error":"Unauthorized"}
GET    /api/incidents/abc  -> 404  GET    /api/incidents/abc  -> 401
PATCH  /api/incidents/abc  -> 404  PATCH  /api/incidents/abc  -> 401
POST   .../abc/approve     -> 404  POST   .../abc/approve     -> 401
POST   /api/investigate    -> 404  POST   /api/investigate    -> 401
POST   /api/slack/webhook  -> 404  POST   /api/slack/webhook  -> 401
```

Before: Clerk returned an HTML `404` (`x-clerk-auth-status: signed-out`). After: every
`/api/*` route returns a consistent JSON `401`. ✅

## Findings & recommendations

- **F1 — Inconsistent unauth responses. (FIXED here.)** `/api/*` now returns JSON `401`
  uniformly via middleware.
- **F2 — Slack webhook is mis-gated. (Owner: [RUN-32](https://linear.app/run-zero/issue/RUN-32))**
  `/api/slack/webhook` is machine-to-machine — Slack cannot present a Clerk session, so it
  is currently unreachable (was 404, now 401). RUN-32 must **both** (a) mark it public in
  `middleware.ts` *and* (b) verify the `X-Slack-Signature`/timestamp using
  `SLACK_SIGNING_SECRET`. It must not be made public without the signature check — doing so
  would expose an unauthenticated mutation endpoint. Intentionally left gated here.
- **F3 — No per-route `auth()` guards (defense-in-depth). (Owner: [RUN-28](https://linear.app/run-zero/issue/RUN-28))**
  Routes rely solely on middleware. RUN-28 should add `const { userId } = await auth()`
  checks inside each handler so protection survives any future middleware-matcher change.
- **F4 — `PATCH /api/incidents/[id]` mass-assignment. (Owner: [RUN-28](https://linear.app/run-zero/issue/RUN-28))**
  The handler spreads the raw request body into `update(body)`, allowing a client to set any
  column. Recommend an allowlist (e.g. only `status`, `assignee`, `notes`).

## Checklist

- [x] Every `/api/*` route requires authentication (Clerk middleware, matcher verified).
- [x] Unauthenticated `/api/*` requests return a consistent `401` JSON response.
- [x] Page routes redirect unauthenticated users to `/sign-in`.
- [x] Input-validation errors return appropriate `400`/`404`.
- [x] Manual test run and recorded (above).
- [ ] Slack webhook made public + signature-verified — **RUN-32**.
- [ ] Per-route `auth()` guards + PATCH field allowlist — **RUN-28**.
