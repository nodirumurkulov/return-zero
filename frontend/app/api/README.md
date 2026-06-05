# API routes

HTTP handlers in `app/api/*/route.ts`. Used by the UI (mutations), Slack webhooks, and optional cron schedulers.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/incidents/[id]` | Incident detail payload |
| `PATCH` | `/api/incidents/[id]` | Update incident fields |
| `POST` | `/api/incidents/[id]/approve` | Approve proposed actions |
| `POST` | `/api/investigate` | Run AI investigation |
| `POST` | `/api/detect` | KPI breach detection (cron-capable) |
| `POST` | `/api/forecast` | Forecast-risk detection (cron-capable) |
| `POST` | `/api/recover` | Advance monitoring recovery (cron-capable) |
| `POST` | `/api/replay` | Advance replay clock (cron or signed-in user) |
| `POST` | `/api/learn` | Learn baselines + business report after upload |
| `POST` | `/api/onboarding/upload` | Multipart CSV import |
| `POST` | `/api/slack/webhook` | Slack interactive button callbacks |

When `CRON_SECRET` is set, scheduler routes (`detect`, `forecast`, `recover`, `replay`) require `Authorization: Bearer <secret>` or `x-cron-secret`.

## Usage

Request bodies are validated with Zod schemas in `lib/<domain>/schemas.ts`:

```typescript
const raw = await req.json().catch(() => ({}));
const parsed = recoverBodySchema.safeParse(raw);
if (!parsed.success) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

User routes: `await createClient()` from `@/lib/supabase/server` + `getUser()`. Cron/seed paths use `createAdminClient()` from `@/lib/supabase/admin`.

## Notes

- Prefer thin routes: auth, parse body, delegate to `lib/<domain>/`.
- Incident lists load via RSC (`listIncidents`); there is no `GET /api/incidents`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
