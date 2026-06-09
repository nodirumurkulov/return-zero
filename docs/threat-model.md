# Threat Model — return-zero (Hugo)

STRIDE-based threat model for the Hugo ecommerce incident-response platform.

**Last updated**: Phase 3A security hardening  
**Scope**: Full application — Next.js frontend, Supabase backend, third-party integrations

---

## 1. System Overview

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Next.js (Vercel) │────▶│  Supabase       │
│   (Client)   │◀────│  App + API Routes │◀────│  (Postgres+Auth)│
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │    ▲
                    ┌──────┘    └──────┐
                    ▼                  ▼
              ┌──────────┐     ┌──────────────┐
              │  Slack   │     │ Shopify      │
              │  (Bot)   │     │ (OAuth+API)  │
              └──────────┘     └──────────────┘
                    ▲
                    │
              ┌──────────┐
              │ Vercel   │
              │ Cron     │
              └──────────┘
```

### Trust boundaries

| Boundary | Description |
|----------|-------------|
| **TB1: Browser ↔ Server** | User browser to Next.js middleware + API routes |
| **TB2: Server ↔ Supabase** | Next.js backend to Supabase (anon key = RLS, service role = admin) |
| **TB3: Slack ↔ Server** | Slack platform to webhook/events endpoints |
| **TB4: Shopify ↔ Server** | Shopify to OAuth callback |
| **TB5: Cron ↔ Server** | Vercel cron scheduler to cron endpoints |
| **TB6: LLM ↔ Server** | Server to OpenAI/Anthropic APIs |

### Data assets

| Asset | Sensitivity | Location |
|-------|-------------|----------|
| User session tokens | High | Browser cookies (Supabase Auth) |
| Supabase service role key | Critical | Server env var |
| Slack signing secret | High | Server env var |
| LLM API keys | High | Server env var |
| CRON_SECRET | High | Server env var |
| Shopify API secret | High | Server env var |
| Organization data | Medium | Postgres (RLS-protected) |
| Incident details | Medium | Postgres (RLS-protected) |
| Store connection secrets | High | Postgres (service-role only) |
| Waitlist emails | Medium | Postgres |

---

## 2. STRIDE Analysis

### S — Spoofing (Identity)

| ID | Threat | Entry Point | Current Mitigation | Risk | Gap |
|----|--------|-------------|-------------------|------|-----|
| S1 | Attacker spoofs a Supabase session cookie | TB1: Any authenticated API route | Supabase Auth validates JWT on every request via `updateSession()` in middleware | Low | Session cookies should use `SameSite=Strict` (currently `Lax`) |
| S2 | Attacker forges Slack webhook signature | TB3: `/api/slack/webhook`, `/api/slack/events` | HMAC-SHA256 signature verification using `timingSafeEqual` with `SLACK_SIGNING_SECRET` | Low | Timestamp replay window should be checked (5 min) |
| S3 | Attacker guesses CRON_SECRET | TB5: `/api/digest`, `/api/stores/incidents/detect`, `/api/stores/orders/advance` | Bearer token or raw secret comparison | Medium | No rate limiting on cron endpoints; brute-force possible if secret is weak |
| S4 | Attacker impersonates another org's user | TB1 → TB2 | RLS policies scope all queries to `user_organization_ids()` | Low | Relies on Supabase RLS correctness; no application-level double-check |
| S5 | Attacker uses stolen Shopify OAuth state | TB4: `/api/shopify/callback` | State cookie verification in `completeOAuth()` | Low | State cookie is `httpOnly`, `secure` (prod), `sameSite: lax` |

### T — Tampering (Data Integrity)

| ID | Threat | Entry Point | Current Mitigation | Risk | Gap |
|----|--------|-------------|-------------------|------|-----|
| T1 | Attacker modifies incident status or approves malicious actions | TB1: `PATCH /api/stores/incidents/[id]`, `POST .../approve` | Supabase RLS — user must be org member | Low | No audit trail of who changed what |
| T2 | Attacker tampers with request body (e.g., inject SQL via Supabase query) | TB1: All API routes | Zod validation at every API boundary (`safeParse`) | Low | Supabase client uses parameterized queries |
| T3 | Attacker modifies KPI thresholds to hide incidents | TB1: `PATCH /api/stores/catalog/[productId]/threshold` | RLS + Zod validation | Medium | No approval workflow for threshold changes; any org member can modify |
| T4 | LLM returns manipulated investigation results | TB6: Investigation flow | LLM output is stored as-is in `agent_findings` | Medium | No output validation or sanitization on LLM responses |
| T5 | Attacker injects malicious data via Shopify import | TB4: `/api/stores/import/shopify` | Zod schema validation on import data | Low | Large imports could contain subtle data corruption |

### R — Repudiation (Audit Trail)

| ID | Threat | Entry Point | Current Mitigation | Risk | Gap |
|----|--------|-------------|-------------------|------|-----|
| R1 | User denies approving incident actions | Approve flow | None — no audit log | **High** | **No audit logging exists.** Cannot prove who approved what, when. |
| R2 | Admin denies modifying detection thresholds | Threshold update | None | **High** | No change history for threshold modifications |
| R3 | Cron job runs cannot be verified | Cron endpoints | Server logs (Vercel) | Medium | No structured audit trail; Vercel logs have limited retention |
| R4 | Slack bot actions cannot be attributed | Hugo Slack bot | Slack message thread | Medium | Actions triggered via Slack not logged in application DB |

### I — Information Disclosure

| ID | Threat | Entry Point | Current Mitigation | Risk | Gap |
|----|--------|-------------|-------------------|------|-----|
| I1 | Server secrets leaked via client bundle | Build time | `NEXT_PUBLIC_*` prefix convention; only URL, anon key, app URL are public | Low | Relies on developer discipline; no automated check |
| I2 | Error messages leak internal details | All API routes | Production error messages are generic ("Could not join waitlist. Try again.") | Low | Dev mode shows detailed errors — ensure NODE_ENV=production in prod |
| I3 | Cross-tenant data leak via broken RLS | TB2: Any data query | RLS policies on every table using `user_organization_ids()` | Low | RLS policies are the single point of failure for tenant isolation |
| I4 | LLM API keys or prompts leaked in browser | TB1: Client components | LLM calls are server-only (`import "server-only"`) | Low | Correct architecture — server components call LLM |
| I5 | Waitlist emails exposed to unauthorized users | TB2: Waitlist table | Waitlist table has no RLS policies (service-role only access) | Low | Only accessed via admin client in waitlist routes |
| I6 | Shopify store connection secrets exposed | TB2: `store_connection_secrets` | Service-role only table, not exposed via RLS | Low | Correctly isolated |

### D — Denial of Service

| ID | Threat | Entry Point | Current Mitigation | Risk | Gap |
|----|--------|-------------|-------------------|------|-----|
| D1 | Flood waitlist signup endpoint | TB1: `POST /api/waitlist` | Rate limiting (5 req/min/IP) | Low | In-memory rate limiter; per-instance on Vercel serverless |
| D2 | Flood pricing chat (LLM cost) | TB1: `POST /api/waitlist/pricing/chat` | Rate limiting (10 req/min/IP) | Medium | Could still accumulate significant LLM costs at scale |
| D3 | Flood authenticated API routes | TB1: Any auth route | No rate limiting on authenticated routes | Medium | Authenticated users could abuse investigation endpoint (LLM calls) |
| D4 | Large Shopify import overwhelms database | TB4: `/api/stores/import/shopify` | Background processing via `after()` | Medium | No import size limits or queuing |
| D5 | Slack bot abuse (trigger many investigations) | TB3: Slack events | No rate limiting on Slack commands | Medium | Malicious Slack workspace member could trigger expensive LLM calls |

### E — Elevation of Privilege

| ID | Threat | Entry Point | Current Mitigation | Risk | Gap |
|----|--------|-------------|-------------------|------|-----|
| E1 | User accesses another organization's data | TB1 → TB2 | RLS: `organization_id IN (SELECT user_organization_ids())` | Low | Correct if RLS policies are complete and tested |
| E2 | User bypasses RLS via direct Supabase API | External | Anon key only allows RLS-scoped access | Low | Service role key must never leak to client |
| E3 | Attacker exploits cron endpoint without CRON_SECRET | TB5 | `assertCronAuthorized()` returns 401/503 | Low | In dev mode without CRON_SECRET configured, cron routes are open |
| E4 | Waitlist user accesses application features | TB1 | Waitlist and app are separate flows; no session crossover | Low | Waitlist tokens are not Supabase sessions |
| E5 | CSRF allows state-changing actions as victim | TB1 | Origin header verification in middleware | Low | Mitigated by Phase 1B CSRF protection |

---

## 3. Risk Matrix

```
            Low Impact    Medium Impact    High Impact
High Prob   D3            D2, D5           —
Med Prob    S3            T3, T4           R1, R2
Low Prob    S1,S2,S4,S5   D4, I3          E2
            T1,T2,T5,E1
            E3,E4,E5,I1
            I2,I4,I5,I6
            D1
```

---

## 4. Top Recommendations (Priority Order)

### Critical — Implement Now

1. **Audit logging (R1, R2)** — Build a `security_events` table to log all state-changing operations: incident approvals, status changes, threshold updates, import actions, and authentication events. This is the biggest gap — without audit logs, you cannot investigate incidents or prove compliance.

2. **Rate limiting on authenticated LLM endpoints (D3, D5)** — Add per-user rate limits on `/api/investigate` and Hugo Slack commands to prevent cost abuse.

### High — Implement Soon

3. **LLM output validation (T4)** — Validate and sanitize LLM investigation results before storing. At minimum, check for prompt injection artifacts and enforce response schema.

4. **Threshold change approval workflow (T3)** — Require confirmation or second approval for KPI threshold changes that could mask incidents.

5. **Cron endpoint hardening (S3)** — Enforce minimum CRON_SECRET length (32+ chars). Add monitoring for failed cron auth attempts.

### Medium — Plan

6. **RLS penetration tests (I3, E1)** — Automated tests that verify tenant isolation by attempting cross-org queries.

7. **Import size limits (D4)** — Cap the number of products/orders per import batch and add queuing for large imports.

8. **Slack command rate limiting (D5)** — Add per-user cooldown on expensive Slack commands (investigate, approve).

---

## 5. Attack Scenarios

### Scenario A: Cross-Site Request Forgery (Mitigated ✓)

**Before Phase 1B**: A malicious website hosts a hidden form targeting `POST /api/stores/incidents/123/approve`. The victim's browser sends the Supabase session cookie automatically → incident actions approved without user consent.

**After Phase 1B**: Middleware checks `Origin` header against `NEXT_PUBLIC_APP_URL`. Cross-origin requests are rejected with 403.

### Scenario B: Multi-Tenant Data Leak

**Attack**: User A (org-1) manipulates a Supabase query to access org-2's incidents.

**Defense**: RLS policy `organization_id IN (SELECT user_organization_ids())` on every table. The `user_organization_ids()` function reads from `auth.uid()` → `organization_members` → returns only the user's org IDs.

**Residual risk**: Relies entirely on RLS correctness. A missing or misconfigured policy on a new table would silently expose data.

### Scenario C: LLM Cost Exhaustion

**Attack**: Authenticated user scripts rapid calls to `POST /api/investigate`, each triggering an expensive LLM agent loop (multiple tool calls, retries).

**Current defense**: Authentication required, but no per-user rate limit.

**Recommendation**: Add per-user rate limiting (e.g., 5 investigations per hour) and per-org daily LLM budget cap.

### Scenario D: Supply Chain Attack via GitHub Actions

**Before Phase 2C**: CI uses `actions/checkout@v4` — a mutable tag. If the `actions/checkout` repository is compromised, the attacker rewrites the `v4` tag to inject code that exfiltrates `GITHUB_TOKEN` or repository secrets.

**After Phase 2C**: All actions pinned to immutable commit SHAs. The attacker would need to compromise the specific commit, which is cryptographically infeasible.

### Scenario E: Slack HMAC Bypass

**Attack**: Attacker sends a crafted POST to `/api/slack/webhook` or `/api/slack/events` with a forged `x-slack-signature` header.

**Defense**: HMAC-SHA256 verification using `SLACK_SIGNING_SECRET` with `timingSafeEqual()` prevents timing attacks. The timestamp in `x-slack-request-timestamp` is checked against the signature.

---

## 6. Data Flow Diagrams

### User Authentication Flow

```
Browser → POST /auth/callback (Supabase Auth)
  → Supabase validates credentials
  → Sets session cookie (httpOnly, secure, sameSite=lax)
  → Subsequent requests: proxy.ts → updateSession() → validates JWT
  → RLS uses auth.uid() for all queries
```

### Cron Flow

```
Vercel Cron → GET /api/digest (Authorization: Bearer <CRON_SECRET>)
  → proxy.ts: matchesCronPath() + hasCronAuth() → bypass session check
  → Route handler: assertCronAuthorized() → double-check
  → Uses createAdminClient() (service role, bypasses RLS)
  → Iterates all orgs via listAllStoreScopes()
```

### Slack Integration Flow

```
Slack Platform → POST /api/slack/events
  → verifySlackSignature(req, SLACK_SIGNING_SECRET) — HMAC check
  → Ack within 3s (Slack timeout)
  → after(): handleHugoMention() with createAdminClient()
  → classifyHugoIntent() → investigate/approve/chat/data_query
  → Response posted in-thread via postSlackMessage()
```

### Shopify OAuth Flow

```
User → GET /api/shopify/auth?shop=store.myshopify.com
  → Validate shop domain, generate state nonce
  → Set state cookie (httpOnly, secure, sameSite=lax)
  → Redirect to Shopify authorize URL

Shopify → GET /api/shopify/callback?code=...&state=...&shop=...
  → Verify state cookie matches state param (CSRF protection)
  → Exchange code for access token
  → Store token in store_connection_secrets (service-role only)
  → Trigger background import via after()
```
