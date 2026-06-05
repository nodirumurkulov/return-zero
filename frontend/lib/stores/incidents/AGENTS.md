# AGENTS.md — lib/stores/incidents

KPI breach detection and incident CRUD. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `incidents.ts` | **`Incidents`** class — CRUD, detect, notify, approve |
| `types.ts` | Types, Zod schemas, status/kanban constants |
| `errors.ts` | `IncidentsError` |
| `index.ts` | Barrel re-export |

AI investigation lives in **`@/lib/hugo`** — route handlers call it after detect, not this module.

Client HTTP: `@/lib/api/stores/incidents/client` (mutations). Hooks: `@/hooks/stores/incidents`.

## Public API

```typescript
import { getStore } from "@/lib/stores/server";

const { incidents } = getStore(supabase);
await incidents.list({ organizationId });
await incidents.get({ id, organizationId });
await incidents.getDetail({ id, organizationId });
await incidents.update({ id, organizationId, patch });
await incidents.approve({ incidentId, actionIds, approvedByUserId });
await incidents.approveAndNotify({ incidentId, actionIds, approvedByUserId, organizationId, appUrl });
await incidents.listActionIds({ incidentId, organizationId, filter });
await incidents.detect({ organizationId, productId, asOf });
await incidents.notifyNew(createdIncidents);
```

`detect` evaluates one product's KPIs against thresholds (via metrics engine) and opens an incident when any metric is in breach and no open incident exists on that product.

## Usage

```typescript
import type { Incident, IncidentDetail } from "@/lib/stores";
import { patchIncidentStatus } from "@/lib/api/stores/incidents/client";
```
