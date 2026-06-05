# AGENTS.md — lib/api

Client-side HTTP boundary for browser and React Query hooks. **Parent:** [../AGENTS.md](../AGENTS.md)

## Scope

- One specialized client file per route group under `app/api/`.
- Built on `@better-fetch/fetch` via [`client.ts`](client.ts) (`createFetch`, same-origin `/api/*`).
- Import response/body Zod from `@/lib/stores/*/schemas` or dedicated response modules (e.g. replay-response).
- **Forbidden:** Supabase, React, `"use client"`, server-only imports.

## Import rules

| Consumer | May import |
|----------|------------|
| `hooks/` (client) | `@/lib/api/*` |
| `components/` | **not** `@/lib/api` — use hooks only |
| `app/api/` | `@/lib/stores/*` — not `@/lib/api` |

## Layout

```
lib/api/
├── client.ts          # base createFetch instance
├── errors.ts          # ApiError, assertApiData
├── incidents/client.ts
├── investigate/client.ts
├── learn/client.ts
└── stores/
    ├── connect/client.ts
    ├── connection/client.ts
    └── analytics/
        ├── catalog/client.ts
        └── replay/client.ts
```

## Conventions

- Mutations throw `ApiError` (or `Error`) on failure — hooks rely on `useMutation` `onError`.
- Prefer typed exported functions (`getIncidentDetail`, `patchIncidentStatus`) over leaking raw `$fetch`.
- Match route handler JSON shapes exactly; validate outputs with Zod when schemas exist.
