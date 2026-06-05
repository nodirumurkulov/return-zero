/**
 * lib/llm.ts
 * Provider-agnostic LLM client.
 * Set LLM_PROVIDER=openai (default) or LLM_PROVIDER=anthropic.
 */

import "server-only";
import OpenAI from "openai";
import type { z } from "zod";

export type Message = { role: "system" | "user" | "assistant"; content: string };

const provider = process.env.LLM_PROVIDER ?? "openai";

async function callOpenAI(messages: Message[]): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.5";
  const base = { model, messages, response_format: { type: "json_object" as const } };
  try {
    const res = await client.chat.completions.create({ ...base, temperature: 0.2 });
    return res.choices[0]?.message?.content ?? "";
  } catch {
    // Some models (e.g. gpt-5.5) only allow the default temperature — retry
    // without the override, keeping JSON mode so output stays valid JSON.
    const res = await client.chat.completions.create(base);
    return res.choices[0]?.message?.content ?? "";
  }
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

async function callLLMRaw(messages: Message[]): Promise<string> {
  return provider === "anthropic" ? await callAnthropic(messages) : await callOpenAI(messages);
}

/**
 * Call the LLM and parse the JSON response with Zod.
 * Returns null when the response is missing or invalid (callers use deterministic fallbacks).
 */
export async function callLLMJson<T>(messages: Message[], schema: z.ZodType<T>): Promise<T | null> {
  try {
    const raw = await callLLMRaw(messages);
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    // Any failure (missing/invalid key, unknown model, network, bad JSON) →
    // null, so callers fall back to deterministic findings instead of erroring.
    return null;
  }
}
