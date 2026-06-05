# AGENTS.md — lib/stores/orders

Replay cursor, orders feed, advance + breach detect. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `orders.ts` | **`Orders`** class — bounds, list, advance, reset |
| `types.ts` | Feed types, replay opts, API Zod schemas |
| `errors.ts` | `OrdersError` |
| `index.ts` | Barrel |

## Public API

```typescript
import { getStore } from "@/lib/stores/server";

const { orders } = getStore(supabase);
await orders.bounds({ organizationId });
await orders.list({ organizationId, after, limit });
await orders.advance({ organizationId, days });
await orders.reset({ organizationId });
```
