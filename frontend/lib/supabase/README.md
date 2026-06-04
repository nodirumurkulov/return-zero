# Supabase (server)

Service-role Supabase client for API routes, server components, and `lib/agents.ts`.

## What's here

| File | Export |
|------|--------|
| `server.ts` | `createServiceClient()` |

Uses `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`. There is **no** browser client in this repo.

## Usage

```typescript
import { createServiceClient } from "@/lib/supabase/server";

const supabase = createServiceClient();
const { data, error } = await supabase.from("incidents").select("*");
```

## Notes

- Never import this module from `"use client"` files.
- Run `bun run verify:secrets` in `frontend/` before PRs to catch accidental client leaks.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
