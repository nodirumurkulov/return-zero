import "server-only";

import { stepCountIs, streamText, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai/model";
import { catalogPromptText, formatUsdFromCents } from "./catalog";
import { canAcceptOffer, clampOfferCents } from "./guardrails";
import {
  appendPricingMessage,
  finalizeNegotiation,
  markNegotiationInProgress,
  updateCurrentOffer,
} from "./mutations";
import { notifyNegotiationAccepted, notifyNegotiationDeclined } from "./notify";
import type { PricingMessage, PricingSession } from "./queries";
import { pricingTierSchema } from "./schemas";

const NEGOTIATION_PROMPT =
  "You are Hugo's early-access pricing specialist. You negotiate Teams and Enterprise plans for an ecommerce incident-response platform. " +
  "Be concise, friendly, and professional. Ask qualifying questions before quoting. " +
  "Never quote prices outside the authorized range. Early Access is free and not part of this negotiation. " +
  "When you quote a price, call makeOffer with the tier and monthly price in cents. " +
  "When the user clearly accepts an offer, call saveAgreedPrice with the tier and price they accepted. " +
  "If they clearly opt out of paid plans, call declinePricing.";

function toModelMessages(messages: PricingMessage[], userMessage: string): ModelMessage[] {
  const history = messages.reduce<ModelMessage[]>((accumulator, message) => {
    if (message.role === "user") {
      return [...accumulator, { role: "user", content: message.content }];
    }
    if (message.role === "assistant") {
      return [...accumulator, { role: "assistant", content: message.content }];
    }
    return [...accumulator, { role: "system", content: message.content }];
  }, []);

  return [...history, { role: "user", content: userMessage }];
}

function buildSystemPrompt(session: PricingSession): string {
  const { signup } = session;
  const offerLine =
    signup.offered_price_cents && signup.selected_tier
      ? `Current offer: ${signup.selected_tier} at ${formatUsdFromCents(signup.offered_price_cents)}/mo.`
      : signup.offered_price_cents
        ? `Current offer: ${formatUsdFromCents(signup.offered_price_cents)}/mo.`
        : "No offer on the table yet.";

  return [
    NEGOTIATION_PROMPT,
    "",
    "Authorized tiers:",
    catalogPromptText(),
    "",
    `Lead email domain: ${signup.email.split("@")[1] ?? "unknown"}`,
    `Negotiation status: ${signup.negotiation_status}`,
    offerLine,
  ].join("\n");
}

function createNegotiationTools(session: PricingSession) {
  return {
    makeOffer: tool({
      description: "Record the current pricing offer when quoting Teams or Enterprise.",
      inputSchema: z.object({
        tier: pricingTierSchema,
        priceCents: z.number().int().positive(),
      }),
      execute: async ({ tier, priceCents }) => {
        const clamped = clampOfferCents(tier, priceCents);
        await updateCurrentOffer(session.signup.id, tier, clamped);
        return {
          tier,
          priceCents: clamped,
          priceLabel: `${formatUsdFromCents(clamped)}/mo`,
        };
      },
    }),
    saveAgreedPrice: tool({
      description:
        "Save the final agreed monthly price when the user explicitly accepts a specific tier and price.",
      inputSchema: z.object({
        tier: pricingTierSchema,
        priceCents: z.number().int().positive(),
      }),
      execute: async ({ tier, priceCents }) => {
        if (!canAcceptOffer(tier, priceCents)) {
          return { saved: false, reason: "Price is outside the authorized range for this tier." };
        }

        await finalizeNegotiation({
          waitlistSignupId: session.signup.id,
          tier,
          agreedPriceCents: priceCents,
          offeredPriceCents: priceCents,
          status: "accepted",
        });
        await notifyNegotiationAccepted({
          email: session.signup.email,
          token: session.signup.confirmation_token,
          tier,
          agreedPriceCents: priceCents,
        });

        return {
          saved: true,
          tier,
          priceCents,
          priceLabel: `${formatUsdFromCents(priceCents)}/mo`,
        };
      },
    }),
    declinePricing: tool({
      description: "Record when the user clearly opts out of paid plans.",
      inputSchema: z.object({}),
      execute: async () => {
        await finalizeNegotiation({
          waitlistSignupId: session.signup.id,
          tier: session.signup.selected_tier ?? "teams",
          agreedPriceCents: 0,
          offeredPriceCents: session.signup.offered_price_cents,
          status: "declined",
        });
        await notifyNegotiationDeclined({ email: session.signup.email });
        return { declined: true };
      },
    }),
  };
}

export async function runPricingNegotiationTurn(session: PricingSession, userMessage: string) {
  const trimmedMessage = userMessage.trim();

  if (trimmedMessage) {
    await appendPricingMessage(session.signup.id, "user", trimmedMessage);
  }

  if (session.signup.negotiation_status === "not_started") {
    await markNegotiationInProgress(session.signup.id);
  }

  return streamText({
    model: getModel(),
    system: buildSystemPrompt(session),
    messages: toModelMessages(session.messages, trimmedMessage),
    tools: createNegotiationTools(session),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      const assistantReply = text.trim();
      if (assistantReply) {
        await appendPricingMessage(session.signup.id, "assistant", assistantReply);
      }
    },
  });
}
