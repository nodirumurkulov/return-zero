# AGENTS.md — lib/stores/incidents

KPI breach detection and incident CRUD. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `incidents.ts` | **`Incidents`** class + route helpers (`listIncidentActionIds`, `approveIncidentAndNotify`) |
| `detect.ts` | Threshold breach → insert incident row |
| `index.ts` | Barrel: types, schemas, status |
| `types.ts`, `schemas.ts`, `status.ts`, `errors.ts` | Types and API validation |
| `notify-new-incidents.ts` | Slack fan-out for new breaches |

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
await incidents.detect({ organizationId, asOf });
```

`detect` scans product KPIs (via metrics engine + catalog thresholds) and opens one incident per breached product with no open incident.

## Usage

```typescript
import type { Incident, IncidentDetail } from "@/lib/stores";
import { patchIncidentStatus } from "@/lib/api/stores/incidents/client";
```
