# lib

Server-side and shared domain logic. Code is split by **domain** — each folder owns types (matching Supabase columns), queries, and mutations.

## What's here

| Module | Import | Responsibility |
|--------|--------|----------------|
| [`stores/`](stores/) | `@/lib/stores`, `@/lib/stores/server` | Unified facade: catalog, orders, import, learn, search, incidents |
| [`stores/import/`](stores/import/) | internal | Platform import loaders |
| [`agents/`](agents/) | `@/lib/agents` | Parallel LLM investigation |
| [`slack.ts`](slack.ts) | `@/lib/slack` | Outbound + inbound Slack payloads |
| [`supabase/`](supabase/) | `@/lib/supabase/server` | Service-role Supabase client |

## Usage

```typescript
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const store = getStore(supabase);
const detail = await store.incidents.getDetail({ id: incidentId, organizationId });
```

API routes validate JSON with Zod in each domain's `schemas.ts` (inline `safeParse` in the route).

## Notes

- Prefer redesign over backward-compat shims; one type per table in `types.ts`.
- Client components import types from `@/lib/stores`; server code uses `@/lib/stores/server` for `getStore`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
