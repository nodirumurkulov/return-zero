# lib/supabase/

Supabase clients for server (and unused browser client pending RUN-75).

- `server.ts` — `createServiceClient()` for API routes and RSC (service role)
- `client.ts` — browser client (dead code; delete in RUN-75)

Use server client in Server Components and route handlers only. Never import service role into `"use client"` files (`verify-secrets.sh` enforces this).
