# API Route Auth & Error-Response Audit (RUN-31)

Audit of every `/api/*` route handler in `frontend/app/api/`: what enforces auth,
whether the route mutates data, and what unauthenticated callers receive.

## How auth is enforced

All routes are gated by Clerk in `frontend/middleware.ts`. The matcher runs the
middleware on every request except Next internals/static assets, and explicitly on
`/(api|trpc)(.*)`. Public routes are `/sign-in`, `/sign-up`, and `/api/slack/webhook`
(the latter added by RUN-32 — see ⚠ F2 below).

As of this change, unauthenticated `/api/*` requests get a **consistent JSON `401`**
(`{"error":"Unauthorized"}`) instead of Clerk's default HTML 404/redirect. Page routes
still redirect unauthenticated users to `/sign-in`.

> Updated after merging `main`: `main` now also ships `/api/detect` (RUN-20) and has
> made `/api/slack/webhook` **public** (RUN-32, partial). Both are reflected below.

## Route inventory

| Route | Methods | Mutates? | Auth mechanism | Unauth response |
|-------|---------|----------|----------------|-----------------|
| `/api/incidents` | GET | no | Clerk middleware | `401 {"error":"Unauthorized"}` |
| `/api/incidents/[id]` | GET, PATCH | PATCH yes | Clerk middleware | `401` |
| `/api/incidents/[id]/approve` | POST | yes | Clerk middleware | `401` |
| `/api/investigate` | POST | yes | Clerk middleware | `401` |
| `/api/detect` | POST | yes (opens incidents) | Clerk middleware + optional `CRON_SECRET` | `401` (see F5) |
| `/api/slack/webhook` | POST | **yes (service role)** | **Public — no auth** ⚠ | **200, request processed** (see ⚠ F2) |

## In-route error responses (input validation)

| Route | Validation errors |
|-------|-------------------|
| `/api/incidents` GET | `500` on DB error |
| `/api/incidents/[id]` GET | `404` when incident missing |
| `/api/incidents/[id]` PATCH | `500` on DB error |
| `/api/incidents/[id]/approve` POST | `400` "No actions to approve"; `500` on DB error |
| `/api/investigate` POST | `400` missing `incident_id`/`product_id`; `500` on failure |
| `/api/detect` POST | `401` if `CRON_SECRET` set and bearer mismatches; `500` on failure |
| `/api/slack/webhook` POST | `400` missing/invalid `payload`; `500` on DB error |

## Manual test (unauthenticated, no Clerk session)

```
# Before (this PR)                 # After (this PR)
GET    /api/incidents      -> 404  GET    /api/incidents      -> 401 {"error":"Unauthorized"}
GET    /api/incidents/abc  -> 404  GET    /api/incidents/abc  -> 401
PATCH  /api/incidents/abc  -> 404  PATCH  /api/incidents/abc  -> 401
POST   .../abc/approve     -> 404  POST   .../abc/approve     -> 401
POST   /api/investigate    -> 404  POST   /api/investigate    -> 401
POST   /api/detect         -> 404  POST   /api/detect         -> 401
POST   /api/slack/webhook  -> 404  POST   /api/slack/webhook  -> 200 (PUBLIC ⚠ see F2)
```

> Note: `/api/slack/webhook` was gated when this audit was first written. After
> merging `main` (RUN-32) it is **public**, so it no longer returns `401` — it
> processes the request. See ⚠ F2 — it is public **without** signature verification.

Before: Clerk returned an HTML `404` (`x-clerk-auth-status: signed-out`). After: every
`/api/*` route returns a consistent JSON `401`. ✅

## Findings & recommendations

- **F1 — Inconsistent unauth responses. (FIXED here.)** `/api/*` now returns JSON `401`
  uniformly via middleware.
- **⚠ F2 — Slack webhook is PUBLIC but UNVERIFIED (active vulnerability). (Owner: [RUN-32](https://linear.app/run-zero/issue/RUN-32))**
  `main` now lists `/api/slack/webhook(.*)` in `isPublicRoute` (RUN-32, half done), but the
  handler in `app/api/slack/webhook/route.ts` performs **service-role mutations** (approves
  `incident_actions`, updates incidents) with **no `X-Slack-Signature`/timestamp check**.
  Anyone on the internet can POST a crafted `payload` and approve/execute actions. This is
  the exact scenario the original audit warned about. **RUN-32 must add signature
  verification using `SLACK_SIGNING_SECRET` before this ships** — or the route must be
  re-gated. Until then this is an open, unauthenticated mutation endpoint.
- **F3 — No per-route `auth()` guards (defense-in-depth). (Owner: [RUN-28](https://linear.app/run-zero/issue/RUN-28))**
  Routes rely solely on middleware. RUN-28 should add `const { userId } = await auth()`
  checks inside each handler so protection survives any future middleware-matcher change.
- **F4 — `PATCH /api/incidents/[id]` mass-assignment. (Owner: [RUN-28](https://linear.app/run-zero/issue/RUN-28))**
  The handler spreads the raw request body into `update(body)`, allowing a client to set any
  column. Recommend an allowlist (e.g. only `status`, `assignee`, `notes`).
- **F5 — `/api/detect` is unreachable by a cron. (Owner: RUN-20 / deploy)**
  The route supports a `CRON_SECRET` bearer so a scheduler can trigger breach detection, but
  Clerk middleware gates `/api/*` and `/api/detect` is **not** public, so a Vercel cron (no
  Clerk session) is rejected with `401` before `CRON_SECRET` is ever checked. To use it as a
  cron, either add `/api/detect` to `isPublicRoute` and rely on `CRON_SECRET`, or invoke it
  with a valid session. (Manual/authenticated calls work today.)

## Checklist

- [x] Every `/api/*` route requires authentication (Clerk middleware, matcher verified).
- [x] Unauthenticated `/api/*` requests return a consistent `401` JSON response.
- [x] Page routes redirect unauthenticated users to `/sign-in`.
- [x] Input-validation errors return appropriate `400`/`404`.
- [x] Manual test run and recorded (above).
- [~] Slack webhook made public — **done on `main` (RUN-32)** — but signature verification is **still missing (⚠ F2, vulnerability)**.
- [ ] Per-route `auth()` guards + PATCH field allowlist — **RUN-28**.
- [ ] `/api/detect` cron reachability (F5) — **RUN-20 / deploy**.
