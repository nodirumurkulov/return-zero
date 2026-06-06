import { z } from "zod";

export const pricingTierSchema = z.enum(["teams", "enterprise"]);

export const negotiationIntentSchema = z.enum([
  "qualify",
  "offer",
  "counter",
  "accept",
  "decline",
]);

export const negotiationStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "accepted",
  "declined",
  "expired",
]);

export const companySignalsSchema = z.object({
  teamSize: z.number().int().positive().optional(),
  storeCount: z.number().int().positive().optional(),
  monthlyRevenueUsd: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const negotiationStateSchema = z.object({
  currentOfferCents: z.number().int().positive().nullable(),
  userBudgetCents: z.number().int().positive().nullable(),
  companySignals: companySignalsSchema,
});

export const agentTurnSchema = z.object({
  intent: negotiationIntentSchema,
  proposedTier: pricingTierSchema.nullable(),
  proposedPriceCents: z.number().int().positive().nullable(),
  userAccepted: z.boolean(),
  userDeclined: z.boolean(),
  userBudgetCents: z.number().int().positive().nullable(),
  companySignals: companySignalsSchema.optional(),
});

export const pricingChatBodySchema = z.object({
  token: z.string().uuid(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      parts: z.array(
        z.object({
          type: z.literal("text"),
          text: z.string(),
        }),
      ),
    }),
  ),
});

export const pricingSessionQuerySchema = z.object({
  token: z.string().uuid(),
});

export type PricingTier = z.infer<typeof pricingTierSchema>;
export type NegotiationIntent = z.infer<typeof negotiationIntentSchema>;
export type NegotiationStatus = z.infer<typeof negotiationStatusSchema>;
export type CompanySignals = z.infer<typeof companySignalsSchema>;
export type NegotiationState = z.infer<typeof negotiationStateSchema>;
export type AgentTurn = z.infer<typeof agentTurnSchema>;
