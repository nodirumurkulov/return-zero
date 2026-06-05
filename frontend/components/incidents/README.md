# Incident components

UI for the incident command center: kanban board, detail layout, approvals, and investigation trigger.

## What's here

| Component | Client? | Purpose |
|-----------|---------|---------|
| `IncidentKanban` | yes | Columns from `KANBAN_COLUMNS` |
| `IncidentCard` | yes | Card + status dropdown |
| `IncidentDetailView` | no (server) | Full detail page layout |
| `TriggerInvestigationButton` | yes | POST `/api/investigate`, then `router.refresh()` |
| `ActionList` | yes | Approve actions via API |
| `AgentFindingCard`, `IncidentTimeline` | no | Display-only |

## Usage

`/incidents` passes `Incident[]` from `listIncidents`.  
`/incidents/[id]` passes `IncidentDetail` from `getIncidentDetail` into `IncidentDetailView`.

## Notes

- Do not client-fetch `/api/incidents/[id]` for the detail page.
- Types always from `@/lib/stores/incidents`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
