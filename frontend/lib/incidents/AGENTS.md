# lib/incidents/

Single source of truth for incident domain types and Supabase access.

## Files

- `types.ts` — table types (`Incident`, …); **same shape as DB columns**
- `schemas.ts` — Zod request body schemas (parsed inline in routes)
- `status.ts` — `INCIDENT_STATUSES`, `KANBAN_COLUMNS`, `isIncidentStatus`
- `queries.ts` — `listIncidents`, `getIncident`, `getIncidentDetail`
- `approve.ts` — `approveIncidentActions`, `listLowRiskProposedActionIds`
- `index.ts` — public API

## Usage

```typescript
import {
  listIncidents,
  getIncidentDetail,
  approveIncidentActions,
  INCIDENT_STATUSES,
  type Incident,
} from "@/lib/incidents";
```

Do not redefine incident types elsewhere or add `*Row` / `from*Row` mappers.
