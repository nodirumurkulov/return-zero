# app/

Next.js App Router: pages, layouts, server actions, and route handlers.

## Rules

- **Default to Server Components.** Add `"use client"` only for hooks, browser APIs, or event handlers.
- **Fetch on the server** via `createServiceClient()` or domain queries (`listIncidents`, `getIncidentDetail`). Avoid client `useEffect` + `fetch` for initial page data (see RUN-76).
- API routes live under `app/api/` — see [api/AGENTS.md](api/AGENTS.md).
- Server actions: `app/actions.ts` — threshold and incident status updates with `revalidatePath`.

## Key routes

| Path | Role |
|------|------|
| `/catalog` | Product health grid |
| `/incidents` | Kanban (server-loaded) |
| `/incidents/[id]` | Detail (moving to server + client islands) |
| `/api/detect`, `/api/investigate`, … | Pipelines |

## Auth

Clerk protects routes via `proxy.ts`. Public: sign-in/up, Slack webhook.
