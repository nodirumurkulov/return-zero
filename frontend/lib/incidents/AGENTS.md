# AGENTS.md — lib/incidents

Incident domain — single source of truth for incident types and Supabase reads/writes. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Export |
|------|--------|
| `types.ts` | `Incident`, `IncidentAction`, `AgentFinding`, `TimelineEvent` |
| `queries.ts` | `listIncidents`, `getIncident`, `getIncidentDetail` |
| `approve.ts` | `approveIncidentActions`, `listLowRiskProposedActionIds` |
| `status.ts` | `INCIDENT_STATUSES`, `KANBAN_COLUMNS`, `isIncidentStatus` |
| `schemas.ts` | `approveIncidentBodySchema` |
| `index.ts` | Public API |

## Usage

```typescript
import {
  getIncidentDetail,
  approveIncidentActions,
  type Incident,
} from "@/lib/incidents";
```

## Best practices

- Single source of truth for incident types and flows — **refactor consumers** when APIs change; no compatibility aliases.
- Extend `approve.ts` / `queries.ts` instead of duplicating logic in routes, Slack, or components.

## Rules

- Do not redefine `Incident` in pages or components.
- Types match DB columns exactly — update `types.ts` when migrations add columns.
- Approve flow is shared by API route and Slack webhook; extend `approve.ts`, not duplicate logic.
