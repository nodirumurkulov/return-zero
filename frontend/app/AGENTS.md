# AGENTS.md — app

Next.js App Router: pages, layouts, server actions. **Parent:** [../../AGENTS.md](../../AGENTS.md) · **Humans:** [README.md](README.md)

## Best practices (App Router)

- **RSC-first:** pages and layouts fetch on the server; never add client `useEffect` + `fetch` for data already available server-side.
- **No backward compat for routing/data:** if a page should be server-driven, migrate it fully — remove legacy client data hooks and duplicate API reads.
- Align with **Next.js App Router** patterns: colocate loading/error only when needed; prefer `revalidatePath` / `dynamic` over stale static assumptions.
- **TanStack Query (client):** mutations and interactive refetch only — no raw client `fetch` for app data. Initial reads stay on the server unless a page uses prefetch + `HydrationBoundary`.

## Development workflow

- Default to **Server Components**; `"use client"` only for hooks, browser APIs, or event handlers.
- Load data with `await createClient()` + domain queries (`listIncidents`, `getIncidentDetail`, `listCatalogWithThresholds`, …).
- Do **not** use client `useEffect` + `fetch` for initial page data.
- Use `export const dynamic = "force-dynamic"` where Supabase data must be fresh.
- Wrap the app in [`QueryProvider`](../components/providers/QueryProvider.tsx) (root layout). Per domain: `lib/<domain>/api/` (functions) + `lib/<domain>/hooks/` (wraps api only).

## TanStack Query

| Use case | Pattern |
|----------|---------|
| List/catalog pages | RSC only (no `useQuery` for initial load) |
| Incident detail | Server `fetchQuery` + `dehydrate` in page → client `useQuery` in `IncidentDetailView` |
| Approve / investigate | `useMutation` → API route; `invalidateQueries` on detail + `revalidatePath` in route |
| Threshold / status | `useMutation` → server action; `revalidatePath` in action (+ query invalidation where cached) |

## Key paths

| Path | Notes |
|------|--------|
| `catalog/`, `catalog/[productId]/` | RSC + catalog queries |
| `incidents/`, `incidents/[incidentId]/` | List RSC; detail prefetches via `get-incident-detail-query-options.ts` + `IncidentDetailView` |
| `actions.ts` | `updateThreshold`, `updateIncidentStatus` + `revalidatePath` |
| `api/` | See [api/AGENTS.md](api/AGENTS.md) |

## Auth

Supabase Auth via [../proxy.ts](../proxy.ts). Public routes: sign-in/up, auth callback, Slack webhook.

Post-auth `next` paths: validate with `authNextPathSchema` from `@/lib/auth/schemas` via `safeParse` at each boundary (sign-in page, `app/auth/actions.ts`, `app/auth/callback/route.ts`). Never add a standalone redirect helper — callback and sign-in must share the same schema.

## Code style

- Import domain types from `@/lib/<domain>`; never redefine in page files.
- Refactor pages you touch to match [lib/AGENTS.md](../lib/AGENTS.md) and root mandate — no parallel type definitions.
- After server actions that mutate data, `revalidatePath` is already used in `actions.ts` — extend consistently.
