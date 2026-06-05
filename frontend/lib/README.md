# lib

Server-side and shared domain logic. Code is split by **domain** — each folder owns types (matching Supabase columns), queries, and mutations.

## What's here

| Module | Import | Responsibility |
|--------|--------|----------------|
| [`stores/incidents/`](stores/incidents/) | `@/lib/stores/incidents` | Incidents, detection, recovery |
| [`stores/analytics/catalog/`](stores/analytics/catalog/) | `@/lib/stores/analytics/catalog` | Product metrics, thresholds, health |
| [`stores/analytics/metrics/`](stores/analytics/metrics/) | `@/lib/stores/analytics/metrics` | KPI definitions, engine, series |
| [`stores/analytics/forecast/`](stores/analytics/forecast/) | `@/lib/stores/analytics/forecast` | Deterministic forecasts |
| [`stores/analytics/search/`](stores/analytics/search/) | `@/lib/stores/analytics/search` | Global search targets |
| [`stores/analytics/replay/`](stores/analytics/replay/) | `@/lib/stores/analytics/replay` | Time-travel cursor + orders feed |
| [`stores/analytics/learn/`](stores/analytics/learn/) | `@/lib/stores/analytics/learn` | Post-connect baselines + business report |
| [`stores/connect/`](stores/connect/) | `@/lib/stores/connect` | Connect schemas + store connectors |
| [`agents/`](agents/) | `@/lib/agents` | Parallel LLM investigation |
| [`slack.ts`](slack.ts) | `@/lib/slack` | Outbound + inbound Slack payloads |
| [`supabase/`](supabase/) | `@/lib/supabase/server` | Service-role Supabase client |

## Usage

```typescript
import { createIncidents, type Incident } from "@/lib/stores/incidents";
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const store = createIncidents(supabase);
const detail = await store.getIncidentDetail(incidentId);
```

API routes validate JSON with Zod in each domain's `schemas.ts` (inline `safeParse` in the route).

## Notes

- Prefer redesign over backward-compat shims; one type per table in `types.ts`.
- `stores/incidents` may import `stores/analytics/metrics` / `forecast`; avoid coupling `catalog` ↔ `incidents`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
