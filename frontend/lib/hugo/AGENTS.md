# AGENTS.md — lib/hugo

`@hugo` Slack assistant: turns an `app_mention` into a chat reply, a data-grounded
answer, or an investigate/approve action. **Parent:** [../AGENTS.md](../AGENTS.md)

## Files

| File | Role |
|------|------|
| `index.ts` | Public surface — `handleHugoMention` orchestrates classify → gather → act → post |
| `schemas.ts` | `hugoIntentSchema` (Zod) for LLM intent classification |
| `intent.ts` | `classifyHugoIntent` — LLM classification with keyword fallback |
| `context.ts` | Incident resolution + model-friendly incident/KPI context strings |
| `actions.ts` | `runHugoInvestigation`, `runHugoApproval` (reuse `agents` / `incidents`) |
| `reply.ts` | `generateChatReply`, `generateDataReply` (free-form LLM text) |

## Flow

`app/api/slack/events` verifies the signature, acks within Slack's 3s window, and
calls `handleHugoMention` in `after()`. The handler:

1. `classifyHugoIntent` → `chat` | `data_query` | `investigate` | `approve`.
2. For actions, `resolveIncident` maps the free-text reference to one incident
   (or asks the user to disambiguate from candidates).
3. Runs the matching path and posts the reply in-thread via `postSlackMessage`.

## Rules

- Slack delivers no user session, so this module uses `createAdminClient()`.
- Transport primitives (signature verify, envelope parse, `postSlackMessage`)
  stay in `@/lib/slack`; this module owns the conversational behaviour only.
- `approve` only runs on an explicit approval intent; it approves low-risk
  proposed actions, mirroring the in-app and button flows.
- `handleHugoMention` never throws — failures are reported back in-thread.
