# components/incidents/

Incident UI. Server pages fetch via `getIncidentDetail`; small client islands for mutations.

## Components

| Component | Role |
|-----------|------|
| `IncidentDetailView` | Server — layout for detail page |
| `TriggerInvestigationButton` | Client — POST investigate, then `router.refresh()` |
| `IncidentKanban`, `IncidentCard` | Client — kanban board |
| `ActionList` | Client — approve actions, `router.refresh()` after success |
| `AgentFindingCard`, `IncidentTimeline` | Display only |

## Rules

- Do not re-export domain types from component files.
- Do not client-fetch `/api/incidents/[id]` for the detail page — use RSC + `router.refresh()`.
