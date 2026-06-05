# Incidents domain

Types, store, detection, recovery, and client hooks for the incident lifecycle.

## What's here

| File | Purpose |
|------|---------|
| `types.ts` | `Incident`, `IncidentAction`, `AgentFinding`, `TimelineEvent`, `IncidentDetail` |
| `status.ts` | `INCIDENT_STATUSES`, `KANBAN_COLUMNS`, `isIncidentStatus` |
| `schemas.ts` | Zod bodies for approve, patch, and recover APIs |
| `store.ts` | **`Incidents`** — list, detail, patch, approve, detect, recover |
| `detect.ts`, `forecast-risk.ts`, `recover.ts`, `severity.ts` | Internal implementation |
| `api/`, `hooks/` | TanStack Query keys and client mutations |

## Usage

```typescript
import { createIncidents, type Incident } from "@/lib/stores/incidents";

const store = createIncidents(supabase);
const incidents = await store.listIncidents(organizationId);
```

## Notes

- Single source for `Incident` — do not redefine in pages or components.
- Call store methods; do not add loose module-level functions.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
