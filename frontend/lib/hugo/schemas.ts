import { z } from "zod";

/**
 * Classified intent for an `@hugo` Slack mention.
 * - `chat` — general open-ended conversation (no app data needed).
 * - `data_query` — a question answered from incident / KPI data.
 * - `investigate` — run the AI investigation for an incident.
 * - `approve` — approve the low-risk proposed fixes for an incident.
 * - `resolve` / `reject` — confirmation-gated Slack actions.
 * - `reopen` / `snooze` — reversible Slack actions that execute immediately.
 *
 * `incident_reference` is the free-text the user used to point at an incident
 * (a title fragment, product name, or id); we resolve it against the DB.
 */
export const hugoIntentSchema = z.object({
  intent: z.enum(["chat", "data_query", "investigate", "approve", "resolve", "reopen", "snooze", "reject"]),
  incident_reference: z.string().nullable(),
  duration_days: z.number().int().positive().nullable(),
});

export type HugoIntent = z.infer<typeof hugoIntentSchema>;
