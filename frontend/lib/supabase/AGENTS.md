# AGENTS.md — lib/supabase

Server-only Supabase client. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## API

```typescript
import { createServiceClient } from "@/lib/supabase/server";
```

Implementation: [server.ts](server.ts) — `@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY`.

## Best practices

- **Server-only client** — if a browser client appears, delete it and fix imports; do not reintroduce `@supabase/ssr` browser helpers.

## Rules

- **Never** import from `"use client"` files.
- No browser client in this repo.
- Run `cd frontend && bun run verify:secrets` after changes that touch env or client bundles.
