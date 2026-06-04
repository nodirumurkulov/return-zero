# lib/supabase/

Server-only Supabase access.

- `server.ts` — `createServiceClient()` (service role) for API routes and RSC

Never import this module from `"use client"` files (`verify-secrets.sh` enforces this).
