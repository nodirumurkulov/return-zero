# app/api/

Route handlers (App Router). Prefer thin routes: auth, parse body, delegate to `lib/<domain>/`.

## Rules

- Parse JSON with domain `schemas.ts` and inline `safeParse` in the route — **no async IIFEs**, no ad-hoc casts.
- Slack interactions: `parseSlackInteractionPayload` from `@/lib/slack`.
- Incident approve/deploy: `approveIncidentActions` from `@/lib/incidents`.
- Use `createServiceClient()` from `@/lib/supabase/server` for service-role access.
