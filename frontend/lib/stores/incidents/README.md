# lib/stores/incidents

KPI breach detection and incident lifecycle (list, detail, patch, approve).

| File | Role |
|------|------|
| `incidents.ts` | **`Incidents`** class |
| `detect.ts` | Threshold breach → insert row |
| `types.ts`, `schemas.ts`, `status.ts` | Types and validation |
| `notify-new-incidents.ts` | Slack notifications for new breaches |

AI investigation is **`@/lib/hugo/investigate-incident`** — called from route handlers after detect, not from this module.
