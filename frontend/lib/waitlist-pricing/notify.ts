import "server-only";

import { sendEmail } from "@/lib/email/client";
import { formatUsdFromCents, getNegotiableTier } from "./catalog";
import type { PricingTier } from "./schemas";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function notifyNegotiationAccepted(params: {
  email: string;
  token: string;
  tier: PricingTier;
  agreedPriceCents: number;
}): Promise<void> {
  const tierName = getNegotiableTier(params.tier).name;
  const price = formatUsdFromCents(params.agreedPriceCents);
  const chatUrl = `${appUrl()}/waitlist/pricing?token=${params.token}`;

  await sendEmail({
    to: params.email,
    subject: "Your Hugo pricing agreement",
    html: `
      <p>Thanks for working with us on pricing.</p>
      <p><strong>${tierName}</strong> at <strong>${price}/month</strong>.</p>
      <p>Our team will follow up with early-access onboarding details shortly.</p>
      <p><a href="${chatUrl}">View your conversation</a></p>
    `,
    text:
      `Thanks for working with us on pricing.\n\n` +
      `${tierName} at ${price}/month.\n\n` +
      `Our team will follow up with early-access onboarding details shortly.\n\n` +
      `View your conversation: ${chatUrl}`,
  }).catch(() => undefined);

  const opsEmail = process.env.NEGOTIATION_OPS_EMAIL;
  if (!opsEmail) {
    return;
  }

  await sendEmail({
    to: opsEmail,
    subject: `Waitlist deal accepted — ${params.email}`,
    html: `
      <p>A waitlist lead accepted negotiated pricing.</p>
      <ul>
        <li>Email: ${params.email}</li>
        <li>Tier: ${tierName}</li>
        <li>Price: ${price}/month</li>
      </ul>
    `,
    text:
      `Waitlist deal accepted\n\n` +
      `Email: ${params.email}\n` +
      `Tier: ${tierName}\n` +
      `Price: ${price}/month`,
  }).catch(() => undefined);
}

export async function notifyNegotiationDeclined(params: {
  email: string;
}): Promise<void> {
  const opsEmail = process.env.NEGOTIATION_OPS_EMAIL;
  if (!opsEmail) {
    return;
  }

  await sendEmail({
    to: opsEmail,
    subject: `Waitlist pricing declined — ${params.email}`,
    html: `<p>${params.email} declined negotiated pricing in the Hugo waitlist chat.</p>`,
    text: `${params.email} declined negotiated pricing in the Hugo waitlist chat.`,
  }).catch(() => undefined);
}
