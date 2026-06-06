# API routes

HTTP handlers in `app/api/*/route.ts`. Used by the UI (mutations), Slack webhooks, and optional cron schedulers.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/api/stores/incidents/[id]` | Update incident fields |
| `POST` | `/api/stores/incidents/[id]/approve` | Approve proposed actions |
| `POST` | `/api/investigate` | Retry AI investigation (delegates to Hugo) |
| `POST` | `/api/stores/incidents/detect` | KPI breach detection (cron-capable); triggers Hugo investigate |
| `POST` | `/api/stores/orders/advance` | Advance replay clock + detect breaches (cron or signed-in user) |
| `GET` | `/api/stores/orders/feed` | Orders feed for replay UI |
| `POST` | `/api/stores/import/[platform]` | Start async store import (`202` + background job for `mock_csv`) |
| `PATCH` | `/api/stores/active` | Switch active store for the signed-in org |
| `GET` | `/api/stores/import/status` | Connection status + product count (poll while syncing) |
| `GET` | `/api/shopify/auth` | Start Shopify OAuth (`intent=login|connect`; connect requires session) |
| `GET` | `/api/shopify/callback` | Shopify OAuth callback (session cookies on response; connects store + background sync) |
| `POST` | `/api/slack/webhook` | Slack interactive approve callbacks (incoming webhook + signing secret; not Chat SDK) |
| `POST` | `/api/slack/events` | Slack Events API — `@hugo` mentions → LLM reply (URL verify + signing secret) |

When `CRON_SECRET` is set, scheduler routes (`detect`, `orders/advance`) require `Authorization: Bearer <secret>` or `x-cron-secret`.

## Slack approval cards (RUN-51)

Configure `SLACK_WEBHOOK_URL` for outbound incident cards and `SLACK_SIGNING_SECRET` for inbound button clicks on `POST /api/slack/webhook`. **Approve Low-Risk Actions** moves the incident to `monitoring` — same outcome as `POST /api/stores/incidents/[id]/approve`.

## @hugo Slack bot

`POST /api/slack/events` powers the conversational `@hugo` assistant. Enable a Bot User + Event Subscriptions (`app_mention`) in the Slack app, scopes `app_mentions:read` + `chat:write` + `channels:history` + `groups:history`, and set the Request URL to `<app>/api/slack/events`. Requires `SLACK_SIGNING_SECRET` (verify requests) and `SLACK_BOT_TOKEN` (`chat.postMessage`). The route acks within Slack's 3s window and generates + posts the LLM reply in-thread via `after()`; Slack retries and bot messages are ignored to prevent loops.

Proactive alerts (digest, new incidents, post-approve cards) post to `organizations.slack_channel_id` via the bot token, then fall back to `SLACK_DEFAULT_CHANNEL`, then `SLACK_WEBHOOK_URL`.

## Usage

Request bodies are validated with Zod schemas in `lib/<domain>/schemas.ts`:

```typescript
const raw = await req.json().catch(() => ({}));
const parsed = advanceBodySchema.safeParse(raw);
if (!parsed.success) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

User routes: `await createClient()` from `@/lib/supabase/server` + `getUser()`. Cron/seed paths use `createAdminClient()` from `@/lib/supabase/admin`.

## Notes

- Prefer thin routes: auth, parse body, delegate to `lib/stores/<domain>/`.
- Incident lists load via RSC (`createIncidents(supabase).listIncidents`); there is no `GET /api/incidents`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-05
