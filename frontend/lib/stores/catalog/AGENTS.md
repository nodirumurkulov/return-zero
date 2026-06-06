# AGENTS.md — lib/stores/catalog

Product catalog metrics, thresholds, health. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `catalog.ts` | **`Catalog`** class — list, get, health, update |
| `types.ts` | Types, KPI keys, Zod schemas |
| `errors.ts` | `CatalogError` |
| `index.ts` | Barrel |

## Public API

```typescript
import { getStore } from "@/lib/stores/server";

const { catalog } = getStore(supabase);
await catalog.list({ organizationId });
await catalog.get({ organizationId, productId });
catalog.health({ product, thresholds });
await catalog.update({ organizationId, productId, metricKey, threshold });
```

Client types: `@/lib/stores`.
