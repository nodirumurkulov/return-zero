# components/incidents/

Client UI for the incidents workflow. **Display only** — types come from `@/lib/incidents`.

## Components

- `IncidentKanban` — uses `KANBAN_COLUMNS` from domain
- `IncidentCard` — uses `INCIDENT_STATUSES` for status dropdown
- `ActionList`, `AgentFindingCard`, `IncidentTimeline` — props typed from `@/lib/incidents`

## Rules

- **Do not re-export** domain types from component files.
- Prefer redesign: move workflow logic to `lib/incidents/` rather than duplicating in components.
