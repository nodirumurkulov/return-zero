import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";

function baseModel(): LanguageModelV3 {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  return provider === "anthropic"
    ? anthropic(process.env.ANTHROPIC_MODEL ?? "claude-opus-4-5")
    : openai(process.env.OPENAI_MODEL ?? "gpt-5.5");
}

export function getModel(): LanguageModelV3 {
  const model = baseModel();
  if (process.env.NODE_ENV === "development") {
    return wrapLanguageModel({ model, middleware: devToolsMiddleware() });
  }
  return model;
}
