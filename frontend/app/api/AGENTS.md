# AGENTS.md — app/api

Route handlers (`app/api/*/route.ts`). **Parent:** [../../../AGENTS.md](../../../AGENTS.md) · **Humans:** [README.md](README.md)

## Pattern

Thin routes: optional cron auth → parse body → delegate to `lib/<domain>/`.

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
| `POST /api/detect`, `/api/forecast`, `/api/recover` | `detection` (+ `schemas.ts` for recover) |
| `POST /api/agents/investigate` | `agents/investigate` + `agents/schemas.ts` |
| `POST /api/incidents/[id]/approve` | `incidents/approve` + `incidents/schemas.ts` |
| `GET/PATCH /api/incidents/[id]` | `incidents/queries` |
| `POST /api/slack/webhook` | `slack.parseSlackInteractionPayload` |

When `CRON_SECRET` is set, detect/forecast/recover require `Authorization: Bearer <secret>` or matching `x-cron-secret`.

## Best practices (API routes)

- **Thin handlers only** — orchestration belongs in `lib/<domain>/`; routes do not accumulate business logic.
- **Zod at the boundary** — `safeParse` inline; no wrapper parsers, no `as Type`, no backward-compatible dual shapes.
- **Delete obsolete endpoints** when flows move (e.g. client fetch replaced by RSC) instead of leaving deprecated routes.

## Rules

- `createServiceClient()` from `@/lib/supabase/server` only.
- No async IIFEs, no ad-hoc `as` casts for request bodies.
- Do not add generic `read-json` helpers — Zod schemas live in the owning domain.
- Follow root [Best practices mandate](../../../AGENTS.md#best-practices-mandate).
