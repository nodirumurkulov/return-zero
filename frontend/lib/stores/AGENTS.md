# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Module layout (every domain)

Each folder under `stores/` follows the **incidents** pattern:

| File | Role |
|------|------|
| `{domain}.ts` | Domain class — all behavior (private helpers inline) |
| `types.ts` | Types, Zod schemas, constants |
| `errors.ts` | `{Domain}Error` |
| `index.ts` | `export { Class }`, `export { Error }`, `export * from "./types"` |

Implementation-only files (e.g. `import/loaders/`, `import/mock/`) stay internal — not exported from `index.ts`.

## Public API

| Entry | Use for |
|-------|---------|
| `@/lib/stores` | Types, Zod schemas (client + server) |
| `@/lib/stores/server` | `getStore(supabase)`, domain errors |

```typescript
import { getStore } from "@/lib/stores/server";

const store = getStore(supabase);
await store.catalog.list({ organizationId });
await store.orders.advance({ organizationId, days: 7 });
await store.incidents.list({ organizationId });
await store.search.list({ organizationId });
await store.import.run({ organizationId, platform: "mock_csv" });
```

## Domains

| Path | Class |
|------|-------|
| `catalog/` | `Catalog` — metrics, thresholds, health |
| `orders/` | `Orders` — replay cursor, feed, advance + detect |
| `incidents/` | `Incidents` — KPI breach detect, CRUD, approve |
| `search/` | `Search` — global search targets |
| `import/` | `Import` — platform loaders |
| `metrics/` | Internal KPI engine (used by catalog + incidents) |

## Commands

```bash
cd frontend && bun run lint && bun run typecheck
```
