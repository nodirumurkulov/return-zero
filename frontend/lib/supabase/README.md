# Supabase (`lib/supabase/`)

Typed clients over `@supabase/ssr` / `@supabase/supabase-js`:

| File | Role |
|------|------|
| `server.ts` | Server — `createClient()` with cookies (RLS as `authenticated`) |
| `admin.ts` | Service role — cron, seed, Slack webhooks, validators only |
| `middleware.ts` | Session refresh for `proxy.ts` |
| `database.types.ts` | `Database`, `Json`, `Tables<>`, `TablesInsert<>`, `TablesUpdate<>`, `Enums<>` (generated) |

No browser client file yet — add `client.ts` with `createBrowserClient` only when a client island cannot use server actions or routes.

## Generated types

`database.types.ts` is generated from the live schema — **do not edit by hand**. Regenerate after migrations:

```bash
cd frontend && bun run db:reset && bun run db:types
# CI / pre-PR: fail if committed types drift from schema
bun run db:types:check
```

Or against a remote project:

```bash
SUPABASE_ACCESS_TOKEN=... bunx supabase gen types typescript \
  --project-id <project-ref> --schema public \
  > lib/supabase/database.types.ts
```

It is excluded from ESLint (generated code). Prefer the `Tables<"name">`, `TablesInsert<"name">`, and `TablesUpdate<"name">` helpers over redefining row shapes.

## Usage

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.from("incidents").select("*");
```

Migrations live in [`../supabase/migrations/`](../supabase/migrations/).
