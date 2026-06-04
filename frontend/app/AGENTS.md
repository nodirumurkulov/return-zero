# AGENTS.md — app

Next.js App Router: pages, layouts, server actions. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Development workflow

- Default to **Server Components**; `"use client"` only for hooks, browser APIs, or event handlers.
- Load data with `createServiceClient()` + domain queries (`listIncidents`, `getIncidentDetail`, `listCatalogWithThresholds`, …).
- Do **not** use client `useEffect` + `fetch` for initial page data.
- Use `export const dynamic = "force-dynamic"` where Supabase data must be fresh.

## Key paths

| Path | Notes |
|------|--------|
| `catalog/`, `catalog/[productId]/` | RSC + catalog queries |
| `incidents/`, `incidents/[incidentId]/` | RSC; detail uses `IncidentDetailView` + client islands |
| `actions.ts` | `updateThreshold`, `updateIncidentStatus` + `revalidatePath` |
| `api/` | See [api/AGENTS.md](api/AGENTS.md) |

## Auth

Clerk via [../proxy.ts](../proxy.ts). Public routes: sign-in/up, Slack webhook.

## Code style

- Import domain types from `@/lib/<domain>`, never redefine in page files.
- After server actions that mutate data, `revalidatePath` is already used in `actions.ts` — extend consistently.
