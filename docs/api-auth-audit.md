# API Route Auth & Error-Response Audit

Audit of every `/api/*` route handler in `frontend/app/api/`: auth enforcement, mutation scope, and error shapes.

**Last reviewed:** 2026-06-04 (Supabase Auth + `frontend/proxy.ts`)

## How auth is enforced

1. **`frontend/proxy.ts`** — Refreshes the Supabase session on each request. Public prefixes: `/sign-in`, `/sign-up`, `/auth/callback`, `/api/slack/webhook`. Scheduler paths (`/api/detect`, `/api/forecast`, `/api/recover`) skip the session gate when `CRON_SECRET` is set and the request presents a valid bearer/`x-cron-secret` (see [`lib/cron-auth.ts`](../frontend/lib/cron-auth.ts)).

2. **Unauthenticated `/api/*`** — JSON `401` with `{ "error": "Unauthorized" }` (not an HTML redirect).

3. **Route-level guards** — Mutating user routes call `supabase.auth.getUser()` and return `401` when missing. Cron routes call `assertCronAuthorized(req)` before using `createAdminClient()`.

## Route inventory

| Route | Methods | Mutates? | Auth mechanism | Unauth response |
|-------|---------|----------|----------------|-----------------|
| `/api/incidents` | GET | no | Proxy + `getUser()` in handler | `401` |
| `/api/incidents/[id]` | GET, PATCH | PATCH yes | Proxy + `getUser()` on PATCH | `401` |
| `/api/incidents/[id]/approve` | POST | yes | Proxy + `getUser()` | `401` |
| `/api/investigate` | POST | yes | Proxy + `getUser()` | `401` |
| `/api/detect` | POST | yes (opens incidents) | `assertCronAuthorized` or session + admin client | `401` / `503` if prod without `CRON_SECRET` |
| `/api/forecast` | POST | yes | Same as detect | Same |
| `/api/recover` | POST | yes | Same as detect | Same |
| `/api/slack/webhook` | POST | yes (service role) | Public route; **HMAC** via `verifySlackRequest` | `401` invalid signature |

## In-route validation

| Route | Validation |
|-------|------------|
| `/api/incidents/[id]` PATCH | `updateIncidentBodySchema` (strict partial allowlist) |
| `/api/incidents/[id]/approve` POST | `approveIncidentBodySchema` |
| `/api/investigate` POST | `investigateBodySchema` |
| `/api/recover` POST | `recoverBodySchema` |
| `/api/slack/webhook` POST | `parseSlackInteractionPayload` after signature verify |

## Cron / production policy

- **Production** requires `CRON_SECRET`; scheduler routes return `503` if it is missing.
- When `CRON_SECRET` is set (any environment), cron routes require `Authorization: Bearer <secret>` or matching `x-cron-secret`.
- **Local dev** without `CRON_SECRET`: cron routes require a normal Supabase session (proxy); routes use the admin client after session check.

## Slack webhook

Inbound requests must pass `verifySlackRequest` (`SLACK_SIGNING_SECRET`, timestamp skew, constant-time HMAC). Without a valid signature the handler returns `401` and performs no mutations.

## Checklist

- [x] Unauthenticated `/api/*` (except signed Slack) returns JSON `401`
- [x] Page routes redirect unauthenticated users to `/sign-in`
- [x] PATCH incidents uses Zod allowlist (no raw body spread)
- [x] Slack webhook verifies signatures before service-role writes
- [x] Cron auth centralized in `lib/cron-auth.ts`
- [x] Production requires `CRON_SECRET` for scheduler routes
- [x] Mutating user routes use `getUser()` defense-in-depth

## Related

- Env reference: [`.env.example`](../.env.example), [DEPLOYMENT.md](./DEPLOYMENT.md)
- Agent conventions: [frontend/app/api/AGENTS.md](../frontend/app/api/AGENTS.md)
