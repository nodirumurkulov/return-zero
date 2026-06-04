# lib/

Server-side and shared domain logic. **Domain-split:** each folder owns types, DB rows, and mappers.

## Domains

| Module | Import | Owns |
|--------|--------|------|
| `incidents/` | `@/lib/incidents` | Incidents, actions, findings, timeline, queries |
| `catalog/` | `@/lib/catalog` | Product metrics, thresholds, health |
| `metrics/` | `@/lib/metrics/types` | Metric engine, monthly series |
| `forecast/` | `@/lib/forecast` | Deterministic forecasts |
| `detection/` | `@/lib/detection/*` | Detect, severity, recover |
| `agents.ts` | `@/lib/agents` | LLM agent orchestration |
| `api/` | `@/lib/api/*` | Shared HTTP helpers (`read-json.ts`) |
| `supabase/` | `@/lib/supabase/server` | Service role client |

## Rules

- No `let`; use `const`, `reduce`, or small named functions.
- Cross-domain imports: `detection` may use `metrics` / `forecast` types only — avoid catalog ↔ incidents coupling.
- Do not import from `components/`.

Each domain subdirectory has `AGENTS.md`.
