import "server-only";

import { generateText, Output } from "ai";
import { getModel } from "@/lib/ai/model";
import { hugoIntentSchema, type HugoIntent } from "./schemas";

const CLASSIFIER_PROMPT =
  "You classify a single Slack message sent to Hugo, an assistant for an " +
  "ecommerce incident-response app. Return ONLY JSON matching: " +
  '{"intent": "chat" | "data_query" | "investigate" | "approve", ' +
  '"incident_reference": string | null}. ' +
  "Rules: " +
  "- 'investigate' only when the user explicitly asks to run/start an investigation on an incident. " +
  "- 'approve' only when the user explicitly asks to approve/apply/deploy fixes for an incident. " +
  "- 'data_query' when they ask about incidents, KPIs, metrics, products, status, or impact. " +
  "- 'chat' for greetings, small talk, or anything not about the app's data. " +
  "incident_reference is the text identifying the incident (title words, product, or id), else null.";

/** Classify a Slack mention into a Hugo intent. */
export async function classifyHugoIntent(prompt: string): Promise<HugoIntent> {
  const clean = prompt.trim();
  if (!clean) return { intent: "chat", incident_reference: null };

  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: hugoIntentSchema }),
    messages: [
      { role: "system", content: CLASSIFIER_PROMPT },
      { role: "user", content: clean },
    ],
  });

  if (!output) {
    throw new Error("Hugo intent classifier: missing structured output");
  }

  return output;
}
