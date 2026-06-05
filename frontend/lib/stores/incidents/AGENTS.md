# AGENTS.md — lib/stores/incidents

Incident lifecycle, detection, and recovery. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `types.ts` | DB row types + `IncidentDetail`, `IncidentRef` |
| `status.ts` | Kanban columns and status/severity constants |
| `schemas.ts` | Zod request bodies for API routes |
| `index.ts` | **`Incidents`** + `createIncidents` — sole public API |
| `detect.ts`, `forecast-risk.ts`, `recover.ts`, `severity.ts` | Internal implementation (not re-exported) |
| `api/`, `hooks/` | Client TanStack wrappers |

## Public API

All domain operations are methods on `Incidents`. Instantiate via `createIncidents(supabase)`:

```typescript
const store = createIncidents(supabase);
await store.listIncidents(organizationId);
await store.detectBreaches({ organizationId, asOf });
await store.approveIncidentActions({ incidentId, actionIds, approvedByUserId });
```

Do not add loose module-level functions — routes and jobs call store methods.

## Types

Use Supabase-generated row types only — no mappers, no `*Row` aliases, no `toRow()`:

```typescript
export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
```

## Usage

```typescript
import { createIncidents, type Incident } from "@/lib/stores/incidents";
import { useApproveActions } from "@/lib/stores/incidents/hooks";
```
