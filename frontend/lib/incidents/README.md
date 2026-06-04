# Incidents domain

Types, queries, status constants, and approve flow for the incident lifecycle.

## What's here

| File | Purpose |
|------|---------|
| `types.ts` | `Incident`, `IncidentAction`, `AgentFinding`, `TimelineEvent` (same shape as DB) |
| `queries.ts` | `listIncidents`, `getIncident`, `getIncidentDetail` |
| `approve.ts` | `approveIncidentActions`, `listLowRiskProposedActionIds` |
| `status.ts` | `INCIDENT_STATUSES`, `KANBAN_COLUMNS`, `isIncidentStatus` |
| `schemas.ts` | Zod body for approve API |

## Usage

```typescript
import {
  getIncidentDetail,
  INCIDENT_STATUSES,
  type Incident,
} from "@/lib/incidents";
```

## Notes

- Single source for `Incident` — do not redefine in pages or components.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
