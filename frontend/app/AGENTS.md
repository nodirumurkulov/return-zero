# AGENTS.md — app

Next.js App Router: pages, layouts, server actions. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Best practices (App Router)

- **RSC-first:** pages and layouts fetch on the server; never add client `useEffect` + `fetch` for data already available server-side.
- **No backward compat for routing/data:** if a page should be server-driven, migrate it fully — remove legacy client data hooks and duplicate API reads.
- Align with **Next.js App Router** patterns: colocate loading/error only when needed; prefer `revalidatePath` / `dynamic` over stale static assumptions.

## Development workflow

- Default to **Server Components**; `"use client"` only for hooks, browser APIs, or event handlers.
- Load data with `await createClient()` + domain queries (`listIncidents`, `getIncidentDetail`, `listCatalogWithThresholds`, …).
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

Supabase Auth via [../proxy.ts](../proxy.ts). Public routes: sign-in/up, auth callback, Slack webhook.

## Code style

- Import domain types from `@/lib/<domain>`; never redefine in page files.
- Refactor pages you touch to match [lib/AGENTS.md](../lib/AGENTS.md) and root mandate — no parallel type definitions.
- After server actions that mutate data, `revalidatePath` is already used in `actions.ts` — extend consistently.
