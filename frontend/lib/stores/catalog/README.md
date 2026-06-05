# lib/stores/catalog

Product catalog metrics, per-KPI thresholds, and health scoring.

| File | Role |
|------|------|
| `catalog.ts` | **`Catalog`** class — list, get, health, update |
| `types.ts` | Types, KPI constants, threshold PATCH Zod |
| `errors.ts` | `CatalogError` |

```typescript
import { getStore } from "@/lib/stores/server";

const { products } = await getStore(supabase).catalog.list({ organizationId });
// each product includes `health`
```

Client types: `@/lib/stores`.
