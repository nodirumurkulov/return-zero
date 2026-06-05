# App routes

Next.js App Router: pages, layouts, and server actions. All data fetching for pages happens here (or in imported server components), not in client `useEffect` hooks.

## What's here

| Route | Type | Purpose |
|-------|------|---------|
| `/` | redirect | → `/catalog` |
| `/catalog`, `/catalog/[productId]` | RSC | Product KPIs and thresholds |
| `/incidents`, `/incidents/[incidentId]` | RSC + client islands | Incident kanban and detail |
| `/dashboard` | redirect | → `/catalog` |
| `/sign-in`, `/sign-up` | Supabase Auth | Authentication |

Server actions live in [`actions.ts`](actions.ts) (e.g. threshold and status updates).

API handlers are under [`api/`](api/) — separate from page routes.

## Usage

Pages use `export const dynamic = "force-dynamic"` where Supabase data must be fresh.

```typescript
import { createIncidents } from "@/lib/stores/incidents";
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const incidents = await createIncidents(supabase).listIncidents(organizationId);
```

## Notes

- Incident detail no longer client-fetches `/api/incidents/[id]`; see [`incidents/[incidentId]/page.tsx`](incidents/[incidentId]/page.tsx).

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
