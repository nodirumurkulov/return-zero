# AGENTS.md — lib

Server-side domain logic. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Scope

User-facing data uses `await createClient()` (RLS). Cron/seed use `createAdminClient()`. Do not import from `components/`.

### `createAdminClient()` exceptions (session routes)

Use the service role only when RLS cannot perform the write. Document new exceptions here:

| Route / module | Why admin |
|----------------|-----------|
| `POST /api/onboarding/connect` | Load Pretty Fly demo pack into contract tables after user auth |
| `POST /api/replay` | Cron replay cursor; also accepts session user when not cron |
| `POST /api/learn` | Baseline/report writes scoped to resolved `organizationId` |
| `POST /api/slack/webhook` | No Slack user session; HMAC-verified inbound |
| `lib/hugo` | Slack @hugo bot; no session (see `hugo/AGENTS.md`) |
| Cron schedulers (`detect`, `forecast`, `recover`, `replay`) | `isCronInvocation()` only — valid `CRON_SECRET` header |

## Domain modules

| Module | Import | Owns |
|--------|--------|------|
| `organizations/` | `@/lib/organizations` | Tenancy: org membership, `requireOrganizationId`, cron tenant iteration |
| `incidents/` | `@/lib/incidents` | Incidents, actions, findings, timeline, approve |
| `catalog/` | `@/lib/catalog` | Metrics, thresholds, health, catalog queries |
| `metrics/` | `@/lib/metrics/*` | KPI engine, definitions, series |
| `detection/` | `@/lib/detection/*` | Detect, severity, recover |
| `forecast/` | `@/lib/forecast` | Deterministic forecasts |
| `ai/` | `@/lib/ai/model` | `getModel()` — provider env switch + DevTools middleware (dev only) |
| `agents/` | `@/lib/agents` | `ToolLoopAgent` investigation (`LlmAgentFinding` ≠ DB `AgentFinding`); tools in `agents/tools/` |
| `hugo/` | `@/lib/hugo` | `@hugo` Slack assistant: intent → chat / data Q&A / investigate / approve |
| `slack.ts` | `@/lib/slack` | Notifications + Slack payload Zod + Events transport |
| `stores/connect/` | `@/lib/stores/connect` | Store connectors (`mock_csv`, `shopify`) |
| `stores/analytics/replay/` | `@/lib/stores/analytics/replay` | Replay cursor, bounds, orders feed |
| `onboarding/` | `@/lib/onboarding/api`, `@/lib/onboarding/hooks` | Connect flow client API + TanStack hooks |
| `supabase/` | `@/lib/supabase/server` | Service-role client |

Each domain folder has its own `AGENTS.md`. Entity types are one file per table (`incident.ts`, not `types.ts`). Client/TanStack code lives in `api/` (functions) and `hooks/` (thin wrappers around `api/`); import via `@/lib/<domain>/api` and `@/lib/<domain>/hooks`. Shared `getQueryClient()` only in `lib/query/query-client.ts`.

### Multi-tenant organization context

- **User routes / server actions:** `const organizationId = await requireOrganizationId(await createClient())`, then pass `organizationId` into domain functions and scoped queries.
- **Cron schedulers:** `listAllOrganizationIds(createAdminClient())` and loop per tenant (`detect`, `forecast`, `recover`, `replay`).
- **Sign-up bootstrap:** `createOrganizationWithOwner(createAdminClient(), { userId, name, slug })` after `auth.signUp` (service role for member insert).
- See [organizations/AGENTS.md](organizations/AGENTS.md) for module layout.

## Best practices (domain layer)

- **Types = database truth.** One type per table/view in `types.ts`; no `*Row`, no `from*Row`, no DTO mappers “for compatibility.”
- **Supabase = typed client only.** `supabase.from("products")`, `supabase.rpc("product_source_facts", args)` with `SupabaseClient<Database>`. Forbidden: dynamic table helpers, `as unknown as` query builders, and unknown-row string coercers — regenerate `database.types.ts` instead.
- **Public surface = `index.ts`.** Schemas in `schemas.ts`; queries/mutations in named files — do not grow god-modules. `lib/` owns domain logic and **shared** Zod schemas — not one-off 3-line utilities for a single server action.
- **Refactor across domains in one PR** when boundaries move; no deprecated barrels or `@deprecated` re-exports.
- Prefer **TypeScript advanced types** only when they clarify domain invariants; avoid clever types that obscure DB shape.
- Cross-domain: `detection` → `metrics` / `forecast` OK; avoid `catalog` ↔ `incidents` coupling.

## Code style

- Follow root [Best practices mandate](../../AGENTS.md#best-practices-mandate).
- When exports change, update **all** call sites (app, api, components, scripts if any) in the same change.

## Commands

Validated via parent package:

```bash
cd frontend && bun run lint && bun run typecheck
```
