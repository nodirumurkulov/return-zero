# Supabase (server)

Service-role Supabase client for API routes, server components, and `lib/agents.ts`.

## What's here

| File | Export |
|------|--------|
| `server.ts` | `createServiceClient()`, `ServiceClient` |
| `database.types.ts` | `Database`, `Json`, `Tables<>`, `TablesInsert<>`, `TablesUpdate<>`, `Enums<>` (generated) |

Uses `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`. The client is typed with the generated `Database` schema (`SupabaseClient<Database>`), so `.from()`, `.rpc()`, insert/update payloads, and query results are type-checked. There is **no** browser client in this repo.

## Generated types

`database.types.ts` is generated from the live schema — **do not edit by hand**. Regenerate after migrations:

```bash
SUPABASE_ACCESS_TOKEN=... bunx supabase gen types typescript \
  --project-id <project-ref> --schema public \
  > lib/supabase/database.types.ts
```

It is excluded from ESLint (generated code). Prefer the `Tables<"name">`, `TablesInsert<"name">`, and `TablesUpdate<"name">` helpers over redefining row shapes.

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
