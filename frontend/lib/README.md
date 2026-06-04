# lib

Server-side and shared domain logic. Code is split by **domain** — each folder owns types (matching Supabase columns), queries, and mutations.

## What's here

| Module | Import | Responsibility |
|--------|--------|----------------|
| [`incidents/`](incidents/) | `@/lib/incidents` | Incidents, actions, findings, timeline |
| [`catalog/`](catalog/) | `@/lib/catalog` | Product metrics, thresholds, health |
| [`metrics/`](metrics/) | `@/lib/metrics/*` | KPI definitions, engine, series |
| [`detection/`](detection/) | `@/lib/detection/*` | Breach detect, severity, recovery |
| [`forecast/`](forecast/) | `@/lib/forecast` | Deterministic forecasts |
| [`agents.ts`](agents.ts) | `@/lib/agents` | Parallel LLM investigation |
| [`slack.ts`](slack.ts) | `@/lib/slack` | Outbound + inbound Slack payloads |
| [`supabase/`](supabase/) | `@/lib/supabase/server` | Service-role Supabase client |

## Usage

```typescript
import { getIncidentDetail, type Incident } from "@/lib/incidents";
import { createServiceClient } from "@/lib/supabase/server";

const supabase = createServiceClient();
const detail = await getIncidentDetail(supabase, incidentId);
```

API routes validate JSON with Zod in each domain's `schemas.ts` (inline `safeParse` in the route).

## Notes

- Prefer redesign over backward-compat shims; one type per table in `types.ts`.
- `detection` may import `metrics` / `forecast`; avoid coupling `catalog` ↔ `incidents`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
