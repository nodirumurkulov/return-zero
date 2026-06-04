# AGENTS.md — lib/incidents

Incident domain — single source of truth for incident types and Supabase reads/writes. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `incident.ts`, `incident-action.ts`, `agent-finding.ts`, `timeline-event.ts` | One entity type per file (DB column shape) |
| `incident-detail.ts` | `IncidentDetail` aggregate |
| `queries.ts` | `listIncidents`, `getIncident`, `getIncidentDetail` (server Supabase) |
| `approve.ts` | `approveIncidentActions`, `listLowRiskProposedActionIds` (server) |
| `status.ts` | `INCIDENT_STATUSES`, `KANBAN_COLUMNS`, `isIncidentStatus` |
| `schemas.ts` | `approveIncidentBodySchema` |
| `incident-query-keys.ts` | TanStack `incidentKeys` |
| `fetch-incident-detail.ts` | Client GET detail (`FetchIncidentDetailInput` entity) |
| `post-approve-incident-actions.ts` | Client POST approve (`PostApproveIncidentActionsInput` entity) |
| `get-incident-detail-query-options.ts` | Server prefetch query options |
| `get-incident-detail-client-query-options.ts` | Client `useQuery` options |
| `use-approve-actions.ts`, `use-update-incident-status.ts` | Client mutation hooks |
| `index.ts` | Public API (server-safe exports only) |

## Usage

```typescript
import {
  getIncidentDetail,
  approveIncidentActions,
  type Incident,
} from "@/lib/incidents";
```

Client hooks and APIs import by function file, e.g. `@/lib/incidents/use-approve-actions`.

## Best practices

- Single source of truth for incident types and flows — **refactor consumers** when APIs change; no compatibility aliases.
- Extend `approve.ts` / `queries.ts` instead of duplicating logic in routes, Slack, or components.
- API inputs/outputs use **object entities** (`{ incident: { id } }`, `{ approval: { … } }`), not loose positional args.

## Rules

- Do not redefine `Incident` in pages or components.
- Types match DB columns exactly — update the entity file when migrations add columns.
- Approve flow is shared by API route and Slack webhook; extend `approve.ts`, not duplicate logic.
