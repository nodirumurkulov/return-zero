# lib/incidents/

Single source of truth for incident domain types and Supabase access.

## Files

- `db.ts` — row shapes (`IncidentRow`, …); **not** re-exported from `index.ts`
- `types.ts` — app types + `from*Row` mappers (internal)
- `status.ts` — `INCIDENT_STATUSES`, `KANBAN_COLUMNS`, `isIncidentStatus`
- `queries.ts` — `listIncidents`, `getIncident`, `getIncidentDetail`
- `approve.ts` — `approveIncidentActions`, `listLowRiskProposedActionIds`
- `index.ts` — public API only

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

Do not redefine `Incident` in pages or components. Do not re-export incident types from `components/incidents/*`.
