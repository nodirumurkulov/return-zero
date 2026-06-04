# components/incidents/

Incident UI: kanban board, cards, action approval, timeline, agent findings.

## Types

Import `Incident`, `IncidentAction`, etc. from `@/lib/incidents`. Re-export from component files only for backward compatibility.

## Components

- `IncidentKanban` — columns by status
- `IncidentCard` — card + status dropdown (server action)
- `ActionList` — approves via `/api/incidents/[id]/approve`
- `AgentFindingCard`, `IncidentTimeline` — display only

## Status list

`STATUSES` in `IncidentCard` should move to `lib/incidents/status.ts` (RUN-75).
