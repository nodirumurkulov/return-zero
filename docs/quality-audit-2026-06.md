# Codebase Quality Audit — June 2026

**Project:** Hugo (`frontend/`)  
**Stack:** Next.js 16, React 19, Supabase, Bun, Vitest, Playwright  
**Depth:** Standard (automated gates + skill-guided area review)  
**Last run:** 2026-06-05

## Executive summary

| Severity | Count (pre-fix) | Fixed in this audit |
|----------|-----------------|---------------------|
| Critical | 0 | — |
| High | 5 | 5 |
| Medium | 12+ | 9 |
| Low | 8+ | 1 |

**Top systemic themes**

1. **Tenancy drift** — Legacy `settings/` module used non-existent/global tables; fixed with migration `011_business_profile.sql` and org-scoped RLS client.
2. **Cron dual-mode** — Dev without `CRON_SECRET` ran all-org admin mode without auth; fixed via `isCronInvocation()`.
3. **Type-safety gap** — `no-unsafe-*` ESLint off globally; expanded to `lib/settings/` (RUN-73 continues domain-by-domain).

## Automated gate baseline

| Gate | Result | Notes |
|------|--------|-------|
| `bun run lint` | PASS | `--max-warnings 0` |
| `bun run typecheck` | PASS | strict TS |
| `bun run test` | PASS | 66 files / 169 tests |
| `bun run test:integration` | PASS | 11 files / 27 tests |
| `bun run build` | PASS | Next.js 16 Turbopack |
| `bun run db:lint` | SKIPPED | Docker unavailable locally |
| `bun run db:test:rls` | SKIPPED | Requires Supabase |
| `bun run validate` | SKIPPED | Requires seeded DB |
| `CI=true bun run e2e` | SKIPPED | Requires Supabase + Docker |

**Metrics snapshot**

| Signal | Value | Target |
|--------|-------|--------|
| `"use client"` TSX files | 30 | Minimal client islands |
| `createAdminClient` call sites | 18 (post-fix) | Documented exceptions only |
| Test files | 77 | Co-located per domain |
| Barrel `index.ts` in `lib/` | 14 | Prefer direct imports where hot |
| `eslint-disable` / `@ts-ignore` | 1 | Near-zero |
| API routes | 13 | Thin + Zod + auth |

---

## Findings by domain

### Security / API — HIGH (fixed)

#### H-1: Cron routes ran admin all-org mode without auth when `CRON_SECRET` unset

- **Evidence:** `app/api/detect/route.ts` (and forecast/recover/replay)
- **Skill/rule:** `server-auth-actions`
- **Fix:** `isCronInvocation()` in `lib/cron-auth.ts`; cron mode only when secret configured + valid header
- **Test:** `detect.integration.test.ts` — 401 without session when secret unset

#### H-2: `onboarding/profile` used admin client without org scoping

- **Evidence:** `app/api/onboarding/profile/route.ts`, `lib/settings/*`
- **Skill/rule:** Supabase security checklist (BOLA/IDOR)
- **Fix:** RLS `createClient()` + `tryGetStoreScope`; migration `011_business_profile.sql`; typed store-scoped queries
- **Effort:** L

#### H-3: PATCH incidents allowed `organization_id` mass-assignment

- **Evidence:** `lib/incidents/schemas.ts:11`, `lib/incidents/queries.ts:101`
- **Fix:** Removed `organization_id` from `updateIncidentBodySchema`; test added
- **Effort:** S

#### H-4 / H-5: Slack webhook + Hugo cross-tenant admin (fixed)

- **Evidence:** `app/api/slack/webhook/route.ts`, `app/api/slack/events/route.ts`, `lib/hugo/index.ts`
- **Fix:** Migration `012_slack_team_mapping.sql` (`organizations.slack_team_id`); `resolveOrganizationIdForSlackTeam()` (`SLACK_ORGANIZATION_ID` env or DB lookup); org-scoped Hugo incident/catalog queries; webhook approve path requires linked workspace
- **Test:** `slack-webhook.integration.test.ts`, `slack-events.integration.test.ts`, `lib/tenancy/slack.test.ts`

### Next.js / App Router — HIGH (fixed)

#### Open redirect in OAuth callback

- **Evidence:** `app/auth/callback/route.ts:13`
- **Skill/rule:** `server-auth-actions`
- **Fix:** `authNextPathSchema` in `lib/auth/schemas.ts` (shared with sign-in actions)
- **Effort:** S

#### Incidents page request waterfall

- **Evidence:** `app/incidents/page.tsx`
- **Skill/rule:** `async-parallel`
- **Fix:** `Promise.all` for incidents + replay_state; single org resolution
- **Effort:** S

#### Threshold mutation stale RSC props

- **Evidence:** `lib/catalog/hooks/use-update-threshold.ts`
- **Fix:** `router.refresh()` on success
- **Effort:** S

### Next.js / App Router — MEDIUM (fixed)

#### BusinessProfileForm client `useEffect` + `fetch`

- **Evidence:** `components/onboarding/BusinessProfileForm.tsx`
- **Fix:** `app/onboarding/page.tsx` preloads profile via `loadBusinessProfile`; `initialProfile` prop on `BusinessProfileForm` / `UploadForm`
- **Effort:** M

#### Product detail overfetches full catalog

- **Evidence:** `lib/catalog/queries.ts` via `catalog/[productId]/page.tsx`
- **Fix:** `getProductCatalogDetail` uses single-product `computeMetricsDetailed` + `loadThresholdsForProduct`
- **Effort:** M

#### Blanket `force-dynamic` — no Cache Components

- **Evidence:** All data pages
- **Status:** Intentional for auth-heavy Supabase app; revisit if adopting PPR

### Domain `lib/` — MEDIUM (improved)

#### Untyped `SupabaseClient` in many modules

- **Evidence:** `incidents/queries.ts`, `detection/*`, `metrics/engine.ts`
- **Fix:** `SupabaseClient<Database>` in incidents, metrics, organizations/slack; RUN-73 ESLint expanded to those paths
- **Open:** Continue RUN-73 for remaining detection/agent modules

#### Manual row mappers in `metrics/engine.ts`

- **Evidence:** `lib/metrics/engine.ts`
- **Fix:** Uses `Database` row types; removed unnecessary type assertions

#### Agent tools omit `organization_id` filter

- **Evidence:** `lib/agents/tools/*-tools.ts`
- **Fix:** Org-scoped queries in inventory, merchandising, and returns tools

### Supabase / Postgres — MEDIUM (partial)

#### Migration 011 adds org-scoped profile tables + config write policies

- **Files:** `supabase/migrations/011_business_profile.sql`
- **Recommendation:** Run `bun run db:types` after `supabase db reset` in CI/dev

#### RLS advisor / EXPLAIN not run locally

- **Recommendation:** Run `supabase db advisors` in CI when CLI available

### Testing — MEDIUM (improved)

#### API integration coverage expanded

- **Added:** `forecast`, `recover`, `replay`, `orders`, `onboarding/profile`, `slack/events`, `slack/webhook` (org-scoped), `investigate`, `learn`, `detect` cron regression, `approve`
- **Remaining gap:** `onboarding/upload` (multipart; covered by E2E onboarding flow)

#### Domains without unit tests

- **Added:** `organizations/queries.test.ts`, `organizations/slack.test.ts`, `agents/schemas.test.ts`
- **Open:** `orders/` queries, `learn/` beyond schemas, `detection/detect.ts` integration path

### CI / Tooling — LOW (improved)

- **Added:** `bun run validate` step after seed in CI e2e job
- **Open:** No Prettier; ESLint-only formatting is intentional
- **Open:** `scripts/**` excluded from ESLint `no-let` rules

---

## Remediation summary (this audit)

| PR slice | Changes |
|----------|---------|
| Security/RLS | Cron auth, onboarding profile tenancy, incident PATCH schema, OAuth redirect, Slack org mapping |
| Type safety | Settings/incidents/metrics typed client + ESLint `no-unsafe-*` expansion |
| Next.js/React | Incidents parallel fetch, threshold `router.refresh()`, RSC-first onboarding profile |
| Domain lib | Hugo/Slack org scoping, agent tool filters, catalog single-product metrics |
| Testing | 11 API integration suites, organizations/agents unit tests |
| CI | `validate` after seed |

---

## Related docs

- [api-auth-audit.md](./api-auth-audit.md)
- [quality-audit-checklist.md](./quality-audit-checklist.md)
- [AGENTS.md](../AGENTS.md)
- [.cursor/rules/](../.cursor/rules/)
