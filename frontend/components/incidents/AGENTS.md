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

## Best practices

- **Incident detail:** `app/incidents/[incidentId]/page.tsx` prefetches with `getIncidentDetailQueryOptions` + `HydrationBoundary`. `IncidentDetailView` uses `useQuery` from `@/lib/stores/incidents/hooks` (same query key) — not a standalone `fetch` to `GET /api/incidents/[id]`.
- Mutations (approve, investigate) go through `@/lib/stores/incidents/hooks` → API routes; invalidate detail queries and/or `router.refresh()` after success.

## Rules

- Types from `@/lib/stores/incidents` only.
- Do **not** add raw `fetch("/api/incidents/...")` in components — use `lib/incidents/api` + hooks.
