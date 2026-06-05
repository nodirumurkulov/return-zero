# AGENTS.md — app/api

Route handlers (`app/api/*/route.ts`). **Parent:** [../../../AGENTS.md](../../../AGENTS.md) · **Humans:** [README.md](README.md)

## Pattern

Thin routes: optional cron auth → parse body → delegate to `lib/stores/`.

```typescript
const raw = await req.json().catch(() => ({}));
const parsed = someBodySchema.safeParse(raw);
if (!parsed.success) {
  return NextResponse.json(
    { error: parsed.error.issues.map((i) => i.message).join("; ") },
    { status: 400 },
  );
}
```

## Store-shaped endpoints

| Route | Domain module |
|-------|----------------|
| `POST /api/stores/connect/mock` | `@/lib/stores` `MockStore` |
| `POST /api/stores/connect/shopify` | `@/lib/stores` `ShopifyStore` |
| `GET /api/stores/connection` | `StoreConnections` |
| `POST /api/stores/analytics/replay` | `stores/analytics/replay` |
| `GET /api/stores/analytics/replay/orders` | `stores/analytics/replay` |
| `POST /api/stores/incidents/detect` | `stores/incidents` |
| `POST /api/stores/incidents/forecast-risk` | `stores/incidents` |
| `POST /api/stores/incidents/recover` | `stores/incidents` |
| `POST /api/investigate` | `agents` (unchanged) |
| `POST /api/learn` | `learn/schemas.ts` |
| `POST /api/incidents/[id]/approve` | `incidents/approve` |
| `GET/PATCH /api/incidents/[id]` | `incidents/queries` |
| `POST /api/slack/webhook` | `slack.parseSlackInteractionPayload` |
| `POST /api/slack/events` | `slack` + `hugo.handleHugoMention` |

Scheduler routes call `assertCronAuthorized` from `@/lib/cron-auth` (`CRON_SECRET` required in production).

## Rules

- User routes: `await createClient()` + `getUser()`; cron/Slack: `createAdminClient()` from `@/lib/supabase/admin`.
- No async IIFEs, no ad-hoc `as` casts for request bodies.
- Follow root [Best practices mandate](../../../AGENTS.md#best-practices-mandate).
