# AGENTS.md — lib

Server-side domain logic. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Scope

All Supabase access for app logic goes through `createServiceClient()` and domain queries. Do not import from `components/`.

## Domain modules

| Module | Import | Owns |
|--------|--------|------|
| `incidents/` | `@/lib/incidents` | Incidents, actions, findings, timeline, approve |
| `catalog/` | `@/lib/catalog` | Metrics, thresholds, health, catalog queries |
| `metrics/` | `@/lib/metrics/*` | KPI engine, definitions, series |
| `detection/` | `@/lib/detection/*` | Detect, severity, recover |
| `forecast/` | `@/lib/forecast` | Deterministic forecasts |
| `agents.ts` | `@/lib/agents` | LLM investigation (`LlmAgentFinding` ≠ DB `AgentFinding`) |
| `slack.ts` | `@/lib/slack` | Notifications + Slack payload Zod |
| `supabase/` | `@/lib/supabase/server` | Service-role client |

Each domain folder has its own `AGENTS.md`.

## Code style

- One type per table/view in `types.ts` — same fields as Supabase columns. No `*Row` aliases, no `from*Row` mappers.
- Public API via `index.ts` only; keep schemas in `schemas.ts`.
- Cross-domain: `detection` → `metrics` / `forecast` OK; avoid `catalog` ↔ `incidents` coupling.
- Redesign over backward compat: update all call sites when exports change.

## Commands

Validated via parent package:

```bash
cd frontend && bun run lint && bun run typecheck
```
