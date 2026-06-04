# API routes

HTTP handlers in `app/api/*/route.ts`. Used by the UI (mutations), Slack webhooks, and optional cron schedulers.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/incidents` | List incidents (JSON) |
| `GET` | `/api/incidents/[id]` | Incident detail payload |
| `PATCH` | `/api/incidents/[id]` | Update incident fields |
| `POST` | `/api/incidents/[id]/approve` | Approve proposed actions |
| `POST` | `/api/investigate` | Run AI investigation |
| `POST` | `/api/detect` | KPI breach detection (cron-capable) |
| `POST` | `/api/forecast` | Forecast-risk detection (cron-capable) |
| `POST` | `/api/recover` | Advance monitoring recovery (cron-capable) |
| `POST` | `/api/slack/webhook` | Slack interactive button callbacks |

When `CRON_SECRET` is set, detect/forecast/recover require `Authorization: Bearer <secret>` or `x-cron-secret`.

## Usage

Request bodies are validated with Zod schemas in `lib/<domain>/schemas.ts`:

```typescript
const raw = await req.json().catch(() => ({}));
const parsed = recoverBodySchema.safeParse(raw);
if (!parsed.success) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

Use `createServiceClient()` from `@/lib/supabase/server` — never the browser client.

## Notes

- Prefer thin routes: auth, parse body, delegate to `lib/<domain>/`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
