import "server-only";
import { callLLMJson } from "@/lib/llm";
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

/** Heuristic fallback used when the LLM classifier is unavailable. */
function fallbackIntent(prompt: string): HugoIntent {
  const text = prompt.toLowerCase();
  if (/\b(investigate|investigation|look into|diagnose)\b/.test(text)) {
    return { intent: "investigate", incident_reference: prompt };
  }
  if (/\b(approve|apply|deploy|accept)\b/.test(text)) {
    return { intent: "approve", incident_reference: prompt };
  }
  if (
    /\b(incident|incidents|kpi|kpis|metric|metrics|product|products|catalog|status|impact|severity|breach|return rate|refund|roas|threshold|health)\b/.test(
      text,
    )
  ) {
    return { intent: "data_query", incident_reference: prompt };
  }
  return { intent: "chat", incident_reference: null };
}

/**
 * Classify a Slack mention into a Hugo intent. Uses the LLM with a JSON schema
 * and falls back to keyword heuristics when the model is unavailable so the bot
 * always routes to a sensible handler.
 */
export async function classifyHugoIntent(prompt: string): Promise<HugoIntent> {
  const clean = prompt.trim();
  if (!clean) return { intent: "chat", incident_reference: null };

  const parsed = await callLLMJson(
    [
      { role: "system", content: CLASSIFIER_PROMPT },
      { role: "user", content: clean },
    ],
    hugoIntentSchema,
  );

  return parsed ?? fallbackIntent(clean);
}
