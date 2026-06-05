# AGENTS.md — lib

Server-side domain logic. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Scope

User-facing data uses `await createClient()` (RLS). Cron/seed use `createAdminClient()`. Do not import from `components/`.

### `createAdminClient()` exceptions (session routes)

Use the service role only when RLS cannot perform the write. Document new exceptions here:

| Route / module | Why admin |
|----------------|-----------|
| `POST /api/onboarding/upload` | Bulk replace of contract tables after user auth |
| `POST /api/replay` | Cron replay cursor; also accepts session user when not cron |
| `POST /api/learn` | Cross-tenant learning writes (authenticated user required first) |
| Cron schedulers (`detect`, `forecast`, `recover`, …) | No user session; `assertCronAuthorized` |

## Domain modules

| Module | Import | Owns |
|--------|--------|------|
| `incidents/` | `@/lib/incidents` | Incidents, actions, findings, timeline, approve |
| `catalog/` | `@/lib/catalog` | Metrics, thresholds, health, catalog queries |
| `metrics/` | `@/lib/metrics/*` | KPI engine, definitions, series |
| `detection/` | `@/lib/detection/*` | Detect, severity, recover |
| `forecast/` | `@/lib/forecast` | Deterministic forecasts |
| `agents/` | `@/lib/agents` | LLM investigation (`LlmAgentFinding` ≠ DB `AgentFinding`) |
| `hugo/` | `@/lib/hugo` | `@hugo` Slack assistant: intent → chat / data Q&A / investigate / approve |
| `slack.ts` | `@/lib/slack` | Notifications + Slack payload Zod + Events transport |
| `supabase/` | `@/lib/supabase/server` | Service-role client |

Each domain folder has its own `AGENTS.md`. Entity types are one file per table (`incident.ts`, not `types.ts`). Client/TanStack code lives in `api/` (functions) and `hooks/` (thin wrappers around `api/`); import via `@/lib/<domain>/api` and `@/lib/<domain>/hooks`. Shared `getQueryClient()` only in `lib/query/query-client.ts`.

## Best practices (domain layer)

- **Types = database truth.** One type per table/view in `types.ts`; no `*Row`, no `from*Row`, no DTO mappers “for compatibility.”
- **Public surface = `index.ts`.** Schemas in `schemas.ts`; queries/mutations in named files — do not grow god-modules.
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
