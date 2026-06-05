# lib

Server-side and shared domain logic. Code is split by **domain** — each folder owns types (matching Supabase columns), queries, and mutations.

## What's here

| Module | Import | Responsibility |
|--------|--------|----------------|
| [`incidents/`](incidents/) | `@/lib/stores/incidents` | Incidents, actions, findings, timeline |
| [`stores/analytics/catalog/`](stores/analytics/catalog/) | `@/lib/stores/analytics/catalog` | Product metrics, thresholds, health |
| [`stores/analytics/metrics/`](stores/analytics/metrics/) | `@/lib/stores/analytics/metrics` | KPI definitions, engine, series |
| [`stores/incidents/`](stores/incidents/) | `@/lib/stores/incidents` | Incidents, detection, recovery |
| [`stores/analytics/forecast/`](stores/analytics/forecast/) | `@/lib/stores/analytics/forecast` | Deterministic forecasts |
| [`stores/analytics/search/`](stores/analytics/search/) | `@/lib/stores/analytics/search` | Global search targets |
| [`agents/`](agents/) | `@/lib/agents` | Parallel LLM investigation |
| [`slack.ts`](slack.ts) | `@/lib/slack` | Outbound + inbound Slack payloads |
| [`supabase/`](supabase/) | `@/lib/supabase/server` | Service-role Supabase client |

## Usage

```typescript
import { getIncidentDetail, type Incident } from "@/lib/stores/incidents";
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
