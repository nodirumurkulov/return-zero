# AGENTS.md — components/incidents

Incident UI. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Components

| File | Server/client | Role |
|------|---------------|------|
| `IncidentDetailView.tsx` | server | Detail layout |
| `TriggerInvestigationButton.tsx` | client | POST `/api/agents/investigate` → `router.refresh()` |
| `IncidentKanban.tsx`, `IncidentCard.tsx` | client | Kanban |
| `ActionList.tsx` | client | Approve → `router.refresh()` |
| `AgentFindingCard.tsx`, `IncidentTimeline.tsx` | server OK | Display |

## Best practices

- Detail page is **RSC-driven** — remove client fetches to incident APIs; use props + `router.refresh()` on mutations only.

## Rules

- Types from `@/lib/incidents` only.
- Do **not** client-fetch `GET /api/incidents/[id]` for the detail page.
