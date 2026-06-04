# app/api/

Route Handlers (`route.ts`). All use `createServiceClient()` unless noted.

## Conventions

- `export const dynamic = "force-dynamic"` on data routes.
- Parse bodies with `lib/api/read-json.ts` or domain Zod schemas (RUN-73) — **no async IIFEs**.
- Return `NextResponse.json()` with consistent `{ error }` on failure.
- Next 16: `params` is `Promise<{ id: string }>` — await `props.params`.

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/detect` | POST | Run breach detection |
| `/api/investigate` | POST | Agent investigation |
| `/api/incidents` | GET | List incidents |
| `/api/incidents/[id]` | GET/PATCH | Detail / update |
| `/api/incidents/[id]/approve` | POST | Approve actions |
| `/api/recover` | POST | Recovery tick (optional `advance_days` body) |
| `/api/forecast` | POST | Forecast |
| `/api/slack/webhook` | POST | Slack interactions (public) |

Incident reads should prefer `getIncidentDetail` from `@/lib/incidents` when returning typed JSON.
