import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/db";

export type WaitlistPricingSignup = Pick<
  Tables<"waitlist_signups">,
  | "id"
  | "email"
  | "confirmation_token"
  | "confirmed_at"
  | "negotiation_status"
  | "selected_tier"
  | "offered_price_cents"
  | "agreed_price_cents"
  | "negotiation_completed_at"
>;

export type PricingMessage = Pick<
  Tables<"waitlist_pricing_messages">,
  "id" | "role" | "content" | "created_at"
>;

export type PricingSession = {
  signup: WaitlistPricingSignup;
  messages: PricingMessage[];
};

export async function getPricingSignupByToken(token: string): Promise<WaitlistPricingSignup | null> {
  const supabase = createAdminClient();
  const row = await supabase
    .from("waitlist_signups")
    .select(
      "id, email, confirmation_token, confirmed_at, negotiation_status, selected_tier, offered_price_cents, agreed_price_cents, negotiation_completed_at",
    )
    .eq("confirmation_token", token)
    .maybeSingle();

  if (row.error) {
    throw new Error(row.error.message);
  }

  return row.data;
}

export async function getPricingSession(token: string): Promise<PricingSession | null> {
  const signup = await getPricingSignupByToken(token);
  if (!signup) {
    return null;
  }

  const supabase = createAdminClient();
  const messagesResult = await supabase
    .from("waitlist_pricing_messages")
    .select("id, role, content, created_at")
    .eq("waitlist_signup_id", signup.id)
    .order("created_at", { ascending: true });

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  return {
    signup,
    messages: messagesResult.data,
  };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return email;
  }
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}
