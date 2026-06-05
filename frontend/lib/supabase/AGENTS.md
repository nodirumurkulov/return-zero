# Supabase clients (`lib/supabase/`)

## Auth checklist (required)

| Rule | Implementation |
|------|----------------|
| **Use `getUser()` for auth** | Middleware, RSC, server actions, user API routes — never `getSession()` for authorization |
| **No gap before `getUser()` in middleware** | `updateSession`: create client → immediately `getUser()` |
| **Return response with cookies** | Always return the `NextResponse` that received `setAll`; clone cookies onto redirects |
| **Per-request server client** | `await createClient()` in each RSC / action / route — no module singleton on server |
| **Admin client** | `createAdminClient()` in `admin.ts` only — cron, seed, Slack webhook, validators |

## Files

| File | Use |
|------|-----|
| `server.ts` | `createClient()` — RSC, server actions, user APIs (RLS) |
| `admin.ts` | `createAdminClient()` — bypass RLS (server-only) |
| `middleware.ts` | `updateSession()` — session refresh + `getUser()` |
| `database.types.ts` | Generated `Database` type — `bun run db:types` after migrations |
| `db.ts` | `Tables<>`, `Views<>` helpers |

There is no `client.ts` until a `"use client"` island needs direct Supabase in the browser. Prefer server actions, RSC data loading, and API routes instead.

## Imports

```ts
// RSC / server actions / user mutations
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Cron / seed only
import { createAdminClient } from "@/lib/supabase/admin";
```

Do **not** import `admin.ts` or service role from `"use client"` files.
