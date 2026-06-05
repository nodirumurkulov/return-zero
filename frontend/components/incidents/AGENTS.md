# AGENTS.md — components/incidents

Incident UI. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Components

| File | Server/client | Role |
|------|---------------|------|
| `IncidentDetailView.tsx` | client | Detail layout; `useQuery` on server-prefetched incident detail |
| `TriggerInvestigationButton.tsx` | client | POST `/api/investigate` → `router.refresh()` |
| `IncidentKanban.tsx`, `IncidentCard.tsx` | client | Kanban |
| `ActionList.tsx` | client | Approve → `router.refresh()` |
| `AgentFindingCard.tsx`, `IncidentTimeline.tsx` | server OK | Display |
| `ReplayControl.tsx` | client | Advance replay via `@/hooks/stores/analytics/replay` |

## Best practices

- **Incident detail:** `app/(app)/incidents/[incidentId]/page.tsx` prefetches with `getIncidentDetailQueryOptions` + `HydrationBoundary`. `IncidentDetailView` uses `useQuery` from `@/hooks/stores/incidents` (same query key).
- Mutations (approve, investigate) go through `@/hooks/stores/incidents` or `@/hooks/agents`; invalidate detail queries and/or `router.refresh()` after success.

## Rules

- Types from `@/types/incidents` (re-exports of `@/lib/stores/incidents` types).
- Do **not** add raw `fetch("/api/incidents/...")` in components — use `@/hooks/stores/incidents` + `@/hooks/agents`.
