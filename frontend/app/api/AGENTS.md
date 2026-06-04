# app/api/

Route handlers (App Router). Prefer thin routes: auth, parse body, delegate to `lib/<domain>/`.

## Rules

- Parse bodies with a **named function** in the route file or domain Zod schemas (RUN-73) — **no async IIFEs**, no `lib/api/read-json`.
- Slack interactions: `parseSlackInteractionPayload` from `@/lib/slack`.
- Incident approve/deploy: `approveIncidentActions` from `@/lib/incidents`.
- Use `createServiceClient()` from `@/lib/supabase/server` for service-role access.
