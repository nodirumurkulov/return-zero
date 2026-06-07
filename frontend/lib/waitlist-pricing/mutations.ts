import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/db";
import type { PricingTier } from "./schemas";

export async function appendPricingMessage(
  waitlistSignupId: string,
  role: "user" | "assistant" | "system",
  content: string,
): Promise<void> {
  const supabase = createAdminClient();
  const row: TablesInsert<"waitlist_pricing_messages"> = {
    waitlist_signup_id: waitlistSignupId,
    role,
    content,
  };

  const inserted = await supabase.from("waitlist_pricing_messages").insert(row);
  if (inserted.error) {
    throw new Error(inserted.error.message);
  }
}

export async function updateCurrentOffer(
  waitlistSignupId: string,
  tier: PricingTier,
  priceCents: number,
): Promise<void> {
  const supabase = createAdminClient();
  const update: TablesUpdate<"waitlist_signups"> = {
    selected_tier: tier,
    offered_price_cents: priceCents,
    negotiation_status: "in_progress",
  };

  const updated = await supabase.from("waitlist_signups").update(update).eq("id", waitlistSignupId);
  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

export async function markNegotiationInProgress(waitlistSignupId: string): Promise<void> {
  const supabase = createAdminClient();
  const update: TablesUpdate<"waitlist_signups"> = {
    negotiation_status: "in_progress",
  };
  const updated = await supabase.from("waitlist_signups").update(update).eq("id", waitlistSignupId);
  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

export async function finalizeNegotiation(params: {
  waitlistSignupId: string;
  tier: PricingTier;
  agreedPriceCents: number;
  offeredPriceCents: number | null;
  status: "accepted" | "declined";
}): Promise<void> {
  const supabase = createAdminClient();
  const update: TablesUpdate<"waitlist_signups"> = {
    negotiation_status: params.status,
    selected_tier: params.status === "accepted" ? params.tier : null,
    offered_price_cents: params.offeredPriceCents,
    agreed_price_cents: params.status === "accepted" ? params.agreedPriceCents : null,
    negotiation_completed_at: new Date().toISOString(),
  };

  const updated = await supabase.from("waitlist_signups").update(update).eq("id", params.waitlistSignupId);
  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

export async function seedOpeningAssistantMessage(waitlistSignupId: string): Promise<string> {
  const content =
    "Hi — I'm Hugo's pricing specialist. Thanks for joining the waitlist. I'd love to find the right plan for your team.\n\n" +
    "To start: how many stores do you monitor today, and roughly how large is your ops or ecommerce team?";

  await appendPricingMessage(waitlistSignupId, "assistant", content);
  await markNegotiationInProgress(waitlistSignupId);
  return content;
}
