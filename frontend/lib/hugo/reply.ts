import "server-only";

import { generateText, type ModelMessage } from "ai";
import { getModel } from "@/lib/ai/model";

const SLACK_STYLE =
  "You are chatting inside Slack. Be concise, friendly, and use plain language. " +
  "Slack does not render Markdown headings or tables, so prefer short paragraphs and " +
  "simple bullet points ('- '). Keep replies under ~1500 characters unless asked for more.";

const CHAT_PROMPT =
  `You are Hugo, the AI assistant for this ecommerce incident-response platform. ${SLACK_STYLE}`;

const DATA_PROMPT =
  `You are Hugo, the AI assistant for this ecommerce incident-response platform. ${SLACK_STYLE} ` +
  "Answer the user's question using ONLY the live app data provided below. " +
  "If the data does not contain the answer, say so plainly instead of guessing. " +
  "When referring to an incident, use its title (the [id] prefix is for your reference). " +
  "Use the Slack thread to resolve pronouns and ordinal references, but use live app data as the source of truth.";

async function generateReply(messages: ModelMessage[]): Promise<string> {
  const { text } = await generateText({ model: getModel(), messages });
  const reply = text.trim();
  if (!reply) {
    throw new Error("Hugo reply: empty model response");
  }
  return reply;
}

/** Free-form chat reply (no app data). */
export async function generateChatReply(userText: string, threadTranscript?: string): Promise<string> {
  const prompt = userText.trim();
  if (!prompt) {
    return "Hi! I'm Hugo 👋 — ask me about your incidents or KPIs, or say 'investigate <incident>' and I'll dig in.";
  }

  const content = threadTranscript
    ? `Slack thread so far:\n${threadTranscript}\n\nLatest message: ${prompt}`
    : prompt;

  return generateReply([
    { role: "system", content: CHAT_PROMPT },
    { role: "user", content },
  ]);
}

/** Data-grounded reply: answers `userText` using the supplied app `context`. */
export async function generateDataReply(
  userText: string,
  context: string,
  threadTranscript?: string,
): Promise<string> {
  const question = threadTranscript
    ? `Slack thread so far:\n${threadTranscript}\n\nLatest question: ${userText}`
    : userText;

  return generateReply([
    { role: "system", content: DATA_PROMPT },
    { role: "user", content: `Live app data:\n${context}\n\n${question}` },
  ]);
}
