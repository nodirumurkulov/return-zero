# AGENTS.md — components/incidents

Incident UI. **Parent:** [../AGENTS.md](../AGENTS.md)

## Data loading

- **List:** RSC in `app/(app)/incidents/page.tsx` via `getStore().incidents.list()`.
- **Detail:** RSC in `app/(app)/incidents/[incidentId]/page.tsx` via `getStore().incidents.getDetail()`; passes `IncidentDetail` to `IncidentDetailView`.
- **Mutations:** `@/hooks/stores/incidents` → `@/lib/api/stores/incidents/client` → `router.refresh()`.
- **Investigation:** triggered by route handlers after detect (`hugo/investigate-incident`); manual retry via `TriggerInvestigationButton` → `POST /api/investigate`.

## Rules

- Do **not** client-fetch incident detail — server passes props.
- Do **not** add raw `fetch("/api/stores/incidents/...")` in components — use hooks + `@/lib/api/stores/incidents/client`.
- Investigation: `@/hooks/agents` (`useTriggerInvestigation`).
