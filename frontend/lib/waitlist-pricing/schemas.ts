import { z } from "zod";

export const pricingTierSchema = z.enum(["teams", "enterprise"]);

export const negotiationStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "accepted",
  "declined",
  "expired",
]);

export const pricingChatBodySchema = z.object({
  token: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

export type PricingTier = z.infer<typeof pricingTierSchema>;
export type NegotiationStatus = z.infer<typeof negotiationStatusSchema>;
