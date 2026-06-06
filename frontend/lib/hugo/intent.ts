import "server-only";

import { generateText, Output } from "ai";
import { getModel } from "@/lib/ai/model";
import { matchDeterministicIntent } from "./intent-fallback";
import { hugoIntentSchema, type HugoIntent } from "./schemas";

const CLASSIFIER_PROMPT =
  "You classify a single Slack message sent to Hugo, an assistant for an " +
  "ecommerce incident-response app. Return ONLY JSON matching: " +
  '{"intent": "chat" | "data_query" | "investigate" | "approve" | "resolve" | "reopen" | "snooze" | "reject", ' +
  '"incident_reference": string | null, "duration_days": number | null}. ' +
  "Rules: " +
  "- 'investigate' only when the user explicitly asks to run/start an investigation on an incident. " +
  "- 'approve' only when the user explicitly asks to approve/apply/deploy fixes for an incident. " +
  "- 'resolve' only when the user explicitly asks to resolve/close an incident. " +
  "- 'reopen' only when the user explicitly asks to reopen an incident. " +
  "- 'snooze' only when the user explicitly asks to snooze/pause/mute an incident; duration_days is the requested number of days, else 7. " +
  "- 'reject' only when the user explicitly asks to reject proposed fixes/actions for an incident. " +
  "- 'data_query' when they ask about incidents, KPIs, metrics, products, stock/inventory levels, status, or impact. " +
  "- 'chat' for greetings, small talk, or anything not about the app's data. " +
  "incident_reference is the text identifying the incident (title words, product, or id), else null. " +
  "duration_days is null unless intent is snooze.";

/** Classify a Slack mention into a Hugo intent. */
export async function classifyHugoIntent(prompt: string): Promise<HugoIntent> {
  const clean = prompt.trim();
  if (!clean) return { intent: "chat", incident_reference: null, duration_days: null };

  const deterministic = matchDeterministicIntent(clean);
  if (deterministic && deterministic.intent !== "data_query") {
    return deterministic;
  }

  try {
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({ schema: hugoIntentSchema }),
      messages: [
        { role: "system", content: CLASSIFIER_PROMPT },
        { role: "user", content: clean },
      ],
    });

    if (output) return output;
  } catch {
    // Fall through to deterministic fallback below.
  }

  return deterministic ?? { intent: "chat", incident_reference: null, duration_days: null };
}
