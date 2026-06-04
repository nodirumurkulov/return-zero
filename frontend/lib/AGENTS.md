# lib/

Server-side and shared domain logic. **Domain-split:** each folder owns types, DB rows, mappers, queries, and mutations.

## Domains

| Module | Import | Owns |
|--------|--------|------|
| `incidents/` | `@/lib/incidents` | Incidents, actions, findings, timeline, status, approve flow, queries |
| `catalog/` | `@/lib/catalog` | Product metrics, thresholds, health, catalog queries |
| `metrics/` | `@/lib/metrics/types` | Metric engine, monthly series |
| `forecast/` | `@/lib/forecast` | Deterministic forecasts |
| `detection/` | `@/lib/detection/*` | Detect, severity, recover |
| `agents.ts` | `@/lib/agents` | LLM orchestration (`LlmAgentFinding` — not DB `AgentFinding`) |
| `slack.ts` | `@/lib/slack` | Webhooks + `parseSlackInteractionPayload` |
| `supabase/` | `@/lib/supabase/server` | Service role client |

## Rules

- No `let`; use `const`, `reduce`, or small named functions.
- **Redesign over backward compat:** change public exports and fix all call sites; no component re-exports of domain types.
- **One type per table/view** in `types.ts` — same fields as Supabase columns. No `*Row` aliases or `from*Row` mappers.
- Cross-domain imports: `detection` may use `metrics` / `forecast` — avoid catalog ↔ incidents coupling.
- Do not import from `components/`.

Each domain subdirectory has `AGENTS.md`.
