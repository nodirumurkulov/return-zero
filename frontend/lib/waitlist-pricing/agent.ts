import "server-only";

import { generateText, Output, streamText, type ModelMessage, type UIMessage } from "ai";
import { getModel } from "@/lib/ai/model";
import { catalogPromptText, formatUsdFromCents } from "./catalog";
import { applyAgentTurn } from "./guardrails";
import {
  appendPricingMessage,
  finalizeNegotiation,
  markNegotiationInProgress,
  upsertPricingState,
} from "./mutations";
import { notifyNegotiationAccepted, notifyNegotiationDeclined } from "./notify";
import type { PricingSession } from "./queries";
import { agentTurnSchema, type NegotiationState } from "./schemas";

const NEGOTIATION_PROMPT =
  "You are Hugo's early-access pricing specialist. You negotiate Teams and Enterprise plans for an ecommerce incident-response platform. " +
  "Be concise, friendly, and professional. Ask qualifying questions before quoting. " +
  "Never quote prices outside the authorized range. Early Access is free and not part of this negotiation. " +
  "When the user clearly accepts an offer, confirm the tier and monthly price in plain language. " +
  "If they decline, acknowledge gracefully and offer to stay in touch.";

function uiMessagesToText(messages: UIMessage[]): string {
  return messages
    .map((message) => {
      const text = message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("");
      return `${message.role}: ${text}`;
    })
    .join("\n");
}

function toModelMessages(messages: UIMessage[]): ModelMessage[] {
  return messages.reduce<ModelMessage[]>((accumulator, message) => {
    const text = message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
    if (!text.trim()) {
      return accumulator;
    }
    if (message.role === "user") {
      return [...accumulator, { role: "user", content: text }];
    }
    if (message.role === "assistant") {
      return [...accumulator, { role: "assistant", content: text }];
    }
    return [...accumulator, { role: "system", content: text }];
  }, []);
}

function buildSystemPrompt(session: PricingSession): string {
  const state = session.state ?? {
    currentOfferCents: null,
    userBudgetCents: null,
    companySignals: {},
  };

  const offerLine =
    state.currentOfferCents && session.signup.selected_tier
      ? `Current offer: ${session.signup.selected_tier} at ${formatUsdFromCents(state.currentOfferCents)}/mo.`
      : state.currentOfferCents
        ? `Current offer: ${formatUsdFromCents(state.currentOfferCents)}/mo.`
        : "No offer on the table yet.";

  return [
    NEGOTIATION_PROMPT,
    "",
    "Authorized tiers:",
    catalogPromptText(),
    "",
    `Lead email domain: ${session.signup.email.split("@")[1] ?? "unknown"}`,
    `Negotiation status: ${session.signup.negotiation_status}`,
    offerLine,
    state.userBudgetCents ? `User budget signal: ${formatUsdFromCents(state.userBudgetCents)}/mo.` : "",
    Object.keys(state.companySignals).length > 0
      ? `Known company signals: ${JSON.stringify(state.companySignals)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function extractAgentTurn(
  assistantReply: string,
  transcript: string,
  state: NegotiationState,
): Promise<ReturnType<typeof applyAgentTurn>> {
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: agentTurnSchema }),
    messages: [
      {
        role: "system",
        content:
          "Extract structured negotiation metadata from the conversation. " +
          "Set userAccepted true only when the user explicitly accepts a specific tier and price. " +
          "Set userDeclined true only when the user clearly opts out of paid plans. " +
          "Use proposedTier/proposedPriceCents for the latest offer discussed by the assistant.",
      },
      {
        role: "user",
        content: [
          `Current state: ${JSON.stringify(state)}`,
          `Transcript:\n${transcript}`,
          `Latest assistant reply:\n${assistantReply}`,
        ].join("\n\n"),
      },
    ],
  });

  if (!output) {
    throw new Error("waitlist-pricing: missing structured turn output");
  }

  return applyAgentTurn(state, output);
}

export function runPricingNegotiationTurn(session: PricingSession, messages: UIMessage[]) {
  const initialState: NegotiationState = session.state ?? {
    currentOfferCents: null,
    userBudgetCents: null,
    companySignals: {},
  };

  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const latestUserText = latestUserMessage?.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();

  return streamText({
    model: getModel(),
    system: buildSystemPrompt(session),
    messages: toModelMessages(messages),
    onFinish: async ({ text }) => {
      const assistantReply = text.trim();
      if (!assistantReply) {
        return;
      }

      if (latestUserText) {
        await appendPricingMessage(session.signup.id, "user", latestUserText);
      }
      await appendPricingMessage(session.signup.id, "assistant", assistantReply);

      if (session.signup.negotiation_status === "not_started") {
        await markNegotiationInProgress(session.signup.id);
      }

      const transcript = uiMessagesToText(messages);
      const applied = await extractAgentTurn(assistantReply, transcript, initialState);
      await upsertPricingState(session.signup.id, applied.state);

      if (applied.declined) {
        await finalizeNegotiation({
          waitlistSignupId: session.signup.id,
          tier: applied.tier ?? "teams",
          agreedPriceCents: applied.offerCents ?? 0,
          offeredPriceCents: applied.offerCents,
          status: "declined",
        });
        await notifyNegotiationDeclined({ email: session.signup.email });
        return;
      }

      if (applied.accepted && applied.tier && applied.offerCents) {
        await finalizeNegotiation({
          waitlistSignupId: session.signup.id,
          tier: applied.tier,
          agreedPriceCents: applied.offerCents,
          offeredPriceCents: applied.offerCents,
          status: "accepted",
        });
        await notifyNegotiationAccepted({
          email: session.signup.email,
          token: session.signup.confirmation_token,
          tier: applied.tier,
          agreedPriceCents: applied.offerCents,
        });
      }
    },
  });
}
