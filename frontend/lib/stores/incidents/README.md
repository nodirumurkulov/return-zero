# lib/stores/incidents

KPI breach detection and incident lifecycle (list, detail, patch, approve).

| File | Role |
|------|------|
| `incidents.ts` | **`Incidents`** class — CRUD, detect, notify, approve |
| `types.ts` | Types, Zod schemas, status/kanban constants |
| `errors.ts` | `IncidentsError` |

AI investigation is **`@/lib/hugo/investigate-incident`** — called from route handlers after detect, not from this module.
