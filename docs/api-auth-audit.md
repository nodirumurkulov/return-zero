# API Route Auth & Error-Response Audit

Audit of every `/api/*` route handler in `frontend/app/api/`: auth enforcement, mutation scope, and error shapes.

**Last reviewed:** 2026-06-05 (quality audit remediation)

## How auth is enforced

1. **`frontend/proxy.ts`** — Refreshes the Supabase session on each request. Public prefixes: `/sign-in`, `/sign-up`, `/auth/callback`, `/api/slack/webhook`, `/api/slack/events`. Scheduler paths (`/api/detect`, `/api/forecast`, `/api/recover`, `/api/replay`) skip the session gate when `CRON_SECRET` is set and the request presents a valid bearer/`x-cron-secret` (see [`lib/cron-auth.ts`](../frontend/lib/cron-auth.ts)).

2. **Unauthenticated `/api/*`** — JSON `401` with `{ "error": "Unauthorized" }` (not an HTML redirect).

3. **Route-level guards** — Mutating user routes call `supabase.auth.getUser()` and return `401` when missing. Cron routes call `assertCronAuthorized(req)`; admin all-org mode only when `isCronInvocation()` is true (secret configured + valid cron header).

## Route inventory

| Route | Methods | Mutates? | Auth mechanism | Client |
|-------|---------|----------|----------------|--------|
| `/api/detect` | POST | yes | `isCronInvocation` → admin all orgs; else session + single org | admin or RLS |
| `/api/forecast` | POST | yes | Same as detect | admin or RLS |
| `/api/recover` | POST | yes | Same as detect | admin or RLS |
| `/api/replay` | POST | yes | Same as detect | admin or RLS |
| `/api/learn` | POST | yes | Session + `tryGetStoreScope` | admin (scoped) |
| `/api/investigate` | POST | yes | Session + `tryGetStoreScope` | RLS |
| `/api/orders` | GET | no | Session + `tryGetStoreScope` | RLS |
| `/api/onboarding/upload` | POST | yes | Session + store scope; bulk replace | admin (scoped) |
| `/api/onboarding/profile` | GET, POST | POST yes | Session + `tryGetStoreScope` | RLS |
| `/api/incidents/[id]` | GET, PATCH | PATCH yes | Session + `tryGetStoreScope` | RLS |
| `/api/incidents/[id]/approve` | POST | yes | Session + `tryGetStoreScope` | RLS |
| `/api/slack/webhook` | POST | yes | HMAC + `resolveOrganizationIdForSlackTeam` | admin (store-scoped) |
| `/api/slack/events` | POST | yes (async) | HMAC; Hugo resolves org from `team_id` | admin via Hugo (org-scoped) |

## In-route validation

| Route | Validation |
|-------|------------|
| `/api/incidents/[id]` PATCH | `updateIncidentBodySchema` (no `organization_id`) |
| `/api/incidents/[id]/approve` POST | `approveIncidentBodySchema` |
| `/api/investigate` POST | `investigateBodySchema` |
| `/api/recover` POST | `recoverBodySchema` |
| `/api/replay` POST | `replayBodySchema` |
| `/api/learn` POST | `learnBodySchema` (empty strict object) |
| `/api/onboarding/profile` POST | `businessProfileInputSchema` |
| `/api/slack/webhook` POST | `parseSlackInteractionPayload` after signature verify |
| `/api/slack/events` POST | `parseSlackEventEnvelope` after signature verify |

## Cron / production policy

- **Production** requires `CRON_SECRET`; scheduler routes return `503` if it is missing.
- When `CRON_SECRET` is set, cron routes require `Authorization: Bearer <secret>` or matching `x-cron-secret`.
- **Local dev** without `CRON_SECRET`: cron routes require a normal Supabase session; **no** admin all-org mode without cron credentials (`isCronInvocation()`).

## Supabase security checklist (API surface)

- [x] User routes use `getUser()` (not `getSession()`)
- [x] `createAdminClient()` only for documented exceptions (see `lib/AGENTS.md`)
- [x] Cron admin mode requires explicit cron credentials when secret is set
- [x] PATCH bodies use Zod strict schemas (no `organization_id` reassignment)
- [x] OAuth callback uses `authNextPathSchema` (no open redirects)
- [x] Slack approve/Hugo paths scoped to org (`resolveOrganizationIdForSlackTeam`, `organizations.slack_team_id`, `SLACK_ORGANIZATION_ID`)

## Slack

Inbound requests must pass `verifySlackRequest` (`SLACK_SIGNING_SECRET`, timestamp skew, constant-time HMAC). Without a valid signature handlers return `401` and perform no mutations.

## Checklist

- [x] Unauthenticated `/api/*` (except signed Slack) returns JSON `401`
- [x] Page routes redirect unauthenticated users to `/sign-in`
- [x] PATCH incidents uses Zod allowlist without `organization_id`
- [x] Slack routes verify signatures before service-role writes
- [x] Cron auth centralized in `lib/cron-auth.ts` with `isCronInvocation()`
- [x] Production requires `CRON_SECRET` for scheduler routes
- [x] Dev without `CRON_SECRET` requires session (not open admin cron)
- [x] `onboarding/profile` uses RLS client + org scoping

## Related

- [quality-audit-2026-06.md](./quality-audit-2026-06.md)
- Env reference: [`.env.example`](../.env.example), [DEPLOYMENT.md](./DEPLOYMENT.md)
- Agent conventions: [frontend/app/api/AGENTS.md](../frontend/app/api/AGENTS.md)
