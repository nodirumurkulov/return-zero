# AGENTS.md — lib/incidents

Incident domain — single source of truth for incident types and Supabase reads/writes. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `incident.ts`, `incident-action.ts`, … | `Tables<>` aliases — one entity type per table file |
| `queries.ts`, `approve.ts`, `schemas.ts`, `status.ts` | Server Supabase / shared logic |
| `api/` | Client + TanStack query functions (exported via `api/index.ts` and root `index.ts`) |
| `hooks/` | `"use client"` — `useMutation` / `useQuery` wrappers around `api/` only |

## `api/`

| File | Role |
|------|------|
| `incident-query-keys.ts` | `incidentKeys` |
| `fetch-incident-detail.ts` | GET incident detail (browser) |
| `post-approve-incident-actions.ts` | POST approve |
| `update-incident-status.ts` | Server action wrapper |
| `get-incident-detail-query-options.ts` | Server prefetch |
| `get-incident-detail-client-query-options.ts` | Client `useQuery` |

## `hooks/`

| File | Wraps |
|------|--------|
| `use-approve-actions.ts` | `postApproveIncidentActions` |
| `use-update-incident-status.ts` | `updateIncidentStatusApi` |

Import hooks from `@/lib/incidents/hooks`, APIs from `@/lib/incidents/api` (also re-exported on `@/lib/incidents` for server-safe api surface).

## Usage

```typescript
import { getIncidentDetail, type Incident } from "@/lib/incidents";
import { useApproveActions } from "@/lib/incidents/hooks";
```

## Rules

- Hooks must not call `fetch` or server actions directly — go through `api/`.
- API inputs/outputs use object entities (`{ incident: { id } }`, `{ approval: { … } }`).
