# AGENTS.md — hooks

React Query wrappers mirroring `lib/` domain layout. **Parent:** [../lib/AGENTS.md](../lib/AGENTS.md)

## Scope

- **`use-*` hooks only** — mutations and client queries wrapping `@/lib/api/*`.
- **`keys.ts`** — TanStack Query key factories (single source per domain).
- **`query-options.ts`** — client prefetch options calling `lib/api`.
- **`query-options.server.ts`** — RSC prefetch via `@/lib/stores/*` (`"server-only"`).
- **No `api.ts` in hooks** — HTTP lives in `lib/api/`.

## Import rules

| Layer | May import |
|-------|------------|
| `hooks/` (client `use-*`, `query-options.ts`) | `@/lib/api/*`, `@/types/*`, TanStack Query — **not** `@/lib/stores` |
| `hooks/**/*.server.ts` | `@/lib/stores/*` (server-only prefetch) |
| `components/` | `@/hooks/*` only — not `@/lib/api` |

## Layout

```
hooks/
├── agents/                    # mirrors lib/agents
│   └── use-trigger-investigation.ts
└── stores/                    # mirrors lib/stores
    ├── incidents/
    ├── connect/
    ├── learn/
    └── analytics/
        ├── catalog/
        └── replay/
```

## Conventions

- Mutations throw on failure — components use `onError` / `mutate` callbacks.
- Invalidate query keys in `onSuccess`; use `router.refresh()` when RSC data must update.
- Server pages import `query-options.server.ts` for `HydrationBoundary` prefetch.
