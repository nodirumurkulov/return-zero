# Supabase (`lib/supabase/`)

Three typed clients over `@supabase/ssr` / `@supabase/supabase-js`:

| File | Role |
|------|------|
| `client.ts` | Browser — `createBrowserClient<Database>` |
| `server.ts` | Server — `createClient()` with cookies (RLS as `authenticated`) |
| `admin.ts` | Service role — cron, seed, validators only |
| `middleware.ts` | Session refresh for `proxy.ts` |

Regenerate types after schema changes:

```bash
cd frontend && supabase db reset && bun run db:types
```

Migrations live in [`../supabase/migrations/`](../supabase/migrations/).
