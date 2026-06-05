import "server-only";

import { generateText, type ModelMessage } from "ai";
import { getModel } from "@/lib/ai/model";

const SLACK_STYLE =
  "You are chatting inside Slack. Be concise, friendly, and use plain language. " +
  "Slack does not render Markdown headings or tables, so prefer short paragraphs and " +
  "simple bullet points ('- '). Keep replies under ~1500 characters unless asked for more.";

const CHAT_PROMPT =
  `You are Hugo, a helpful assistant for the Resolve ecommerce incident-response app. ${SLACK_STYLE}`;

const DATA_PROMPT =
  `You are Hugo, an assistant for the Resolve ecommerce incident-response app. ${SLACK_STYLE} ` +
  "Answer the user's question using ONLY the live app data provided below. " +
  "If the data does not contain the answer, say so plainly instead of guessing. " +
  "When referring to an incident, use its title (the [id] prefix is for your reference).";

async function generateReply(messages: ModelMessage[]): Promise<string> {
  const { text } = await generateText({ model: getModel(), messages });
  const reply = text.trim();
  if (!reply) {
    throw new Error("Hugo reply: empty model response");
  }
  return reply;
}

/** Free-form chat reply (no app data). */
export async function generateChatReply(userText: string): Promise<string> {
  const prompt = userText.trim();
  if (!prompt) {
    return "Hi! I'm Hugo 👋 — ask me about your incidents or KPIs, or say 'investigate <incident>' and I'll dig in.";
  }

  return generateReply([
    { role: "system", content: CHAT_PROMPT },
    { role: "user", content: prompt },
  ]);
}

/** Data-grounded reply: answers `userText` using the supplied app `context`. */
export async function generateDataReply(userText: string, context: string): Promise<string> {
  return generateReply([
    { role: "system", content: DATA_PROMPT },
    { role: "user", content: `Live app data:\n${context}\n\nQuestion: ${userText}` },
  ]);
}
