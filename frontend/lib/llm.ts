/**
 * LLM helpers — server-side only (Node.js runtime).
 * Supports OpenAI (default) and Anthropic via LLM_PROVIDER env var.
 *
 * Set one of:
 *   OPENAI_API_KEY    + LLM_PROVIDER=openai      (default)
 *   ANTHROPIC_API_KEY + LLM_PROVIDER=anthropic
 */

import { getProductDetail } from "@/lib/supabase-data";

type Message = { role: string; content: string };

// ── Tool definition (get_product_sizing) ─────────────────────────────────────

const TOOL_OPENAI = {
  type: "function" as const,
  function: {
    name: "get_product_sizing",
    description:
      "Get real sizing return rate, directional bias (runs_small / runs_large / " +
      "true_to_size), and inventory by size for a specific Pretty Fly product. " +
      "Always call this before making any size recommendation — never guess.",
    parameters: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The product_id to look up, e.g. prod_00004",
        },
      },
      required: ["product_id"],
    },
  },
};

const TOOL_ANTHROPIC = {
  name: "get_product_sizing",
  description:
    "Get real sizing return rate, directional bias, and inventory by size " +
    "for a specific Pretty Fly product. Always call this before recommending a size.",
  input_schema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "The product_id to look up, e.g. prod_00004",
      },
    },
    required: ["product_id"],
  },
};

async function handleToolCall(name: string, args: Record<string, string>, productId: string) {
  if (name === "get_product_sizing") {
    const pid = args.product_id || productId;
    const detail = await getProductDetail(pid);
    return detail ?? { error: `Product ${pid} not found` };
  }
  return { error: `Unknown tool: ${name}` };
}

// ── chatWithTools ─────────────────────────────────────────────────────────────

export async function chatWithTools(
  messages: Message[],
  system: string,
  productId: string,
): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  if (provider === "anthropic") {
    return chatAnthropic(messages, system, productId);
  }
  return chatOpenAI(messages, system, productId);
}

async function chatOpenAI(messages: Message[], system: string, productId: string): Promise<string> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: system }, ...messages] as Parameters<typeof client.chat.completions.create>[0]["messages"],
    tools: [TOOL_OPENAI],
    tool_choice: "auto",
    temperature: 0.3,
  });

  const msg = response.choices[0].message;

  if (msg.tool_calls?.length) {
    const toolResults = await Promise.all(
      msg.tool_calls.map(async (tc) => {
        // tc can be ChatCompletionMessageToolCall (has .function) or custom
        const fn = (tc as { function: { name: string; arguments: string } }).function;
        const result = await handleToolCall(
          fn.name,
          JSON.parse(fn.arguments),
          productId,
        );
        return {
          role: "tool" as const,
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        };
      }),
    );

    const followup = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        ...messages,
        msg,
        ...toolResults,
      ] as Parameters<typeof client.chat.completions.create>[0]["messages"],
      temperature: 0.3,
    });
    return followup.choices[0].message.content ?? "";
  }

  return msg.content ?? "";
}

async function chatAnthropic(messages: Message[], system: string, productId: string): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 512,
    system,
    messages: messages as Parameters<typeof client.messages.create>[0]["messages"],
    tools: [TOOL_ANTHROPIC] as Parameters<typeof client.messages.create>[0]["tools"],
  });

  if (response.stop_reason === "tool_use") {
    const toolResults: { type: string; tool_use_id: string; content: string }[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const result = await handleToolCall(block.name, block.input as Record<string, string>, productId);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }
    const followup = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 512,
      system,
      messages: [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ] as Parameters<typeof client.messages.create>[0]["messages"],
    });
    const first = followup.content[0];
    return first.type === "text" ? first.text : "";
  }

  const first = response.content[0];
  return first.type === "text" ? first.text : "";
}

// ── simpleCompletion ──────────────────────────────────────────────────────────

export async function simpleCompletion(prompt: string, maxTokens = 80): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? "openai";

  if (provider === "anthropic") {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const first = r.content[0];
    return first.type === "text" ? first.text.trim() : "";
  }

  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const r = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.4,
  });
  return r.choices[0].message.content?.trim() ?? "";
}
