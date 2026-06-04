/**
 * lib/llm.ts
 * Provider-agnostic LLM client.
 * Set LLM_PROVIDER=openai (default) or LLM_PROVIDER=anthropic.
 */

import "server-only";
import OpenAI from "openai";

export type Message = { role: "system" | "user" | "assistant"; content: string };

const provider = process.env.LLM_PROVIDER ?? "openai";

async function callOpenAI(messages: Message[]): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  return res.choices[0].message.content ?? "";
}

async function callAnthropic(messages: Message[]): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const userMsgs = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: systemMsg,
      messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  const json = (await res.json()) as { content: Array<{ text: string }> };
  return json.content?.[0]?.text ?? "";
}

/**
 * Call the LLM and parse the JSON response.
 * Both providers are instructed to return a JSON object.
 */
export async function callLLM<T = Record<string, unknown>>(
  messages: Message[]
): Promise<T> {
  const raw = provider === "anthropic"
    ? await callAnthropic(messages)
    : await callOpenAI(messages);

  try {
    return JSON.parse(raw) as T;
  } catch {
    // If not valid JSON, wrap in a text field
    return { text: raw } as T;
  }
}
