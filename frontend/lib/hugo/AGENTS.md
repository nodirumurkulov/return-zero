# AGENTS.md — lib/hugo

`@hugo` Slack assistant: turns an `app_mention` into a chat reply, a data-grounded
answer, or an investigate/approve action. **Parent:** [../AGENTS.md](../AGENTS.md)

## Files

| File | Role |
|------|------|
| `index.ts` | Public surface — `handleHugoMention` orchestrates classify → gather → act → post |
| `schemas.ts` | `hugoIntentSchema` (Zod) for LLM intent classification |
| `intent.ts` | `classifyHugoIntent` — LLM classification with keyword fallback |
| `context.ts` | Incident resolution + model-friendly incident/KPI/inventory context strings |
| `actions.ts` | `runHugoInvestigation`, `runHugoApproval` (reuse `agents` / `incidents`) |
| `reply.ts` | `generateChatReply`, `generateDataReply` (free-form LLM text) |
| `digest.ts` | `summarizeIncidents`, `buildDigestBlocks` — pure digest formatting for daily Slack cron |

## Flow

`app/api/slack/events` verifies the signature, acks within Slack's 3s window, and
calls `handleHugoMention` in `after()`. The handler:

1. `classifyHugoIntent` → `chat` | `data_query` | `investigate` | `approve`.
2. For actions, `resolveIncident` maps the free-text reference to one incident
   (or asks the user to disambiguate from candidates).
3. Runs the matching path and posts the reply in-thread via `postSlackMessage`.

For `data_query`, the context is assembled on demand from the prompt: open
incidents always, the matched incident's detail when referenced, KPI/catalog
health when `wantsCatalog`, and per-product stock levels (units on hand, daily
outflow, days-to-stockout from burn rate) when `wantsInventory`.

## Rules

- Slack delivers no user session, so this module uses `createAdminClient()`.
- Transport primitives (signature verify, envelope parse, `postSlackMessage`)
  stay in `@/lib/slack`; this module owns the conversational behaviour only.
- `approve` only runs on an explicit approval intent; it approves low-risk
  proposed actions, mirroring the in-app and button flows.
- `handleHugoMention` never throws — failures are reported back in-thread.

## Proactive (cron)

`GET /api/digest` (Vercel cron, daily 08:00 UTC) — iterates all orgs, calls
`summarizeIncidents` + `buildDigestBlocks`, posts via `postWebhookBlocks`.
`GET /api/detect` (Vercel cron, every 6h) — runs breach detection; new
incidents auto-alert to Slack via `notifyNewIncident` in the detect path.
