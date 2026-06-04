# lib/incidents/

Single source of truth for incident domain types and Supabase reads.

## Files

- `db.ts` — row shapes (`IncidentRow`, …)
- `types.ts` — app types + `from*Row` mappers
- `queries.ts` — `listIncidents`, `getIncidentDetail`
- `index.ts` — public exports

## Usage

```typescript
import { listIncidents, getIncidentDetail, type Incident } from "@/lib/incidents";
```

Do not redefine `Incident` in pages or components.
