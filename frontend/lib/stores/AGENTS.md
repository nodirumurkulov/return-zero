# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Public API

Two entry points:

| Entry | Use for |
|-------|---------|
| `@/lib/stores` | Types, Zod schemas, pure helpers (client + server) |
| `@/lib/stores/server` | `getStore(supabase)` and server-only exports (RSC, API routes, scripts) |

```typescript
import { getStore } from "@/lib/stores/server";

const store = getStore(supabase);
await store.catalog.list({ organizationId });
await store.orders.advance({ organizationId, days: 7 });
await store.incidents.list({ organizationId });
await store.learn.run({ organizationId });
await store.search.list({ organizationId });
await store.import.run({ organizationId, platform: "mock_csv" });
await store.import.status({ organizationId });
```

**`getStore`** returns the facade only (no DB side effects). **`store.import.run`** creates/refreshes org store data in Postgres.

## Layout

| Path | Role |
|------|------|
| `index.ts` | Client-safe types, schemas, pure helpers |
| `server.ts` | `getStore`, server-only re-exports |
| `store.ts` | `Store` + `getStore` |
| `import/` | Platform import loaders + `Import` domain |
| `catalog/` | Product metrics, thresholds, health, forecast |
| `orders/` | Replay cursor + orders feed |
| `incidents/` | Detection and lifecycle |
| `learn/` | Post-import baselines + business report |
| `search/` | Global search targets |
| `metrics/` | **Internal** KPI engine |

## Method naming

Verb + opts on every domain class (`list`, `get`, `update`, `advance`, `run`, …). Domain context is implicit from the struct member.

## Rules

- Outside `lib/stores/`, ESLint blocks `@/lib/stores/*` subpaths.
- Client components must not import `@/lib/stores/server`.
- Client fetch: `lib/api/stores/*`; hooks: `hooks/stores/*`.
- No backward-compat factories (`createIncidents`, `createReplay`, `createStore`).
