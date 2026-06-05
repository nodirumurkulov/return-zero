# AGENTS.md — lib/hugo

`@hugo` Slack assistant and unified AI SDK investigation agent. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `handleHugoMention`, `runIncidentInvestigation`, schemas |
| `core/agent.ts` | Single `ToolLoopAgent` for Slack + investigation |
| `core/hugo-request.ts` / `hugo-response.ts` | Request/response types |
| `tools/` | AI SDK tools (`resolve-reference`, `catalog`, `orders`, `forecast`, …) |
| `context.ts` | Incident resolution helpers used by tools |
| `schemas.ts` | Zod at boundaries (`investigateBodySchema`, persist input) |

## Flow

`app/api/slack/events` calls `handleHugoMention` in `after()`. One Hugo agent picks tools
(no intent pre-classification) and ends with `finalResponse` for Slack.

`POST /api/investigate` calls `runIncidentInvestigation` — same tool set, stops on `persistInvestigation`.

Client hook: `@/hooks/hugo` (`useTriggerInvestigation`).

## Rules

- Slack delivers no user session — use `createAdminClient()`.
- Transport stays in `@/lib/slack`; conversational behaviour lives here.
- Tools import store analytics/incidents public modules only.
- `handleHugoMention` never throws — failures are reported in-thread.
