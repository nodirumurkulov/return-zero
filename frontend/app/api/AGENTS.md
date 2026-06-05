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

## Endpoints

| Route | Domain module |
|-------|----------------|
| `GET /api/digest` | `hugo/digest` — daily digest to Slack (cron-only) |
| `POST /api/stores/connect/mock` | `@/lib/stores` `MockStore` |
| `POST /api/stores/connect/shopify` | `@/lib/stores` `ShopifyStore` |
| `GET /api/stores/connection` | `StoreConnections` |
| `POST /api/stores/analytics/replay` | `stores/orders` (replay) |
| `GET /api/stores/analytics/replay/orders` | `stores/orders` (replay) |
| `POST /api/stores/incidents/detect` | `stores/incidents` |
| `POST /api/stores/incidents/forecast-risk` | `stores/incidents` |
| `POST /api/stores/incidents/recover` | `stores/incidents` |
| `POST /api/investigate` | `agents/persist-investigation` + `agents/schemas.ts` |
| `POST /api/learn` | `learn/schemas.ts` |
| `POST /api/incidents/[id]/approve` | `incidents/approve` |
| `GET/PATCH /api/incidents/[id]` | `incidents/queries` |
| `POST /api/slack/webhook` | `slack.parseSlackInteractionPayload` |
| `POST /api/slack/events` | `slack` + `hugo.handleHugoMention` |

Scheduler routes call `assertCronAuthorized` from `@/lib/cron-auth` (`CRON_SECRET` required in production).

## Best practices (API routes)

- **Thin handlers only** — orchestration belongs in `lib/<domain>/`; routes do not accumulate business logic.
- **Zod at the boundary** — `safeParse` inline; no wrapper parsers, no `as Type`, no backward-compatible dual shapes.
- **Delete obsolete endpoints** when flows move (e.g. client fetch replaced by RSC) instead of leaving deprecated routes.

## Rules

- User routes: `await createClient()` + `getUser()`; cron/Slack: `createAdminClient()` from `@/lib/supabase/admin`.
- No async IIFEs, no ad-hoc `as` casts for request bodies.
- Do not add generic `read-json` helpers — Zod schemas live in the owning domain.
- Follow root [Best practices mandate](../../../AGENTS.md#best-practices-mandate).
