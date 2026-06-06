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
| `POST` | `/api/slack/webhook` | Slack interactive approve callbacks (incoming webhook + signing secret; not Chat SDK) |
| `POST` | `/api/slack/events` | Slack Events API — `@hugo` mentions → LLM reply (URL verify + signing secret) |

When `CRON_SECRET` is set, scheduler routes (`detect`, `forecast`, `recover`, `replay`) require `Authorization: Bearer <secret>` or `x-cron-secret`.

## Slack approval cards (RUN-51)

Configure `SLACK_WEBHOOK_URL` for outbound incident cards and `SLACK_SIGNING_SECRET` for inbound button clicks on `POST /api/slack/webhook`. **Approve Low-Risk Actions** moves the incident to `monitoring`, captures the recovery baseline, and posts a monitoring update — same outcome as `POST /api/incidents/[id]/approve`.

## @hugo Slack bot

`POST /api/slack/events` powers the conversational `@hugo` assistant. Enable a Bot User + Event Subscriptions (`app_mention`) in the Slack app, scopes `app_mentions:read` + `chat:write` + `channels:history` + `groups:history`, and set the Request URL to `<app>/api/slack/events`. Requires `SLACK_SIGNING_SECRET` (verify requests) and `SLACK_BOT_TOKEN` (`chat.postMessage`). The route acks within Slack's 3s window and generates + posts the LLM reply in-thread via `after()`; Slack retries and bot messages are ignored to prevent loops.

Proactive alerts (digest, new incidents, post-approve cards) post to `organizations.slack_channel_id` via the bot token, then fall back to `SLACK_DEFAULT_CHANNEL`, then `SLACK_WEBHOOK_URL`.

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
