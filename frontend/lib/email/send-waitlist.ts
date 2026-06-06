import "server-only";

import { sendEmail } from "@/lib/email/client";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function sendWaitlistConfirmation(email: string, confirmationToken: string): Promise<void> {
  const confirmUrl = `${appUrl()}/api/waitlist/confirm?token=${confirmationToken}`;

  await sendEmail({
    to: email,
    subject: "Confirm your Hugo waitlist spot",
    html: `
      <p>Thanks for joining the Hugo waitlist.</p>
      <p><a href="${confirmUrl}">Confirm your email</a> to secure early access.</p>
      <p>If you did not request this, you can ignore this message.</p>
    `,
    text: `Thanks for joining the Hugo waitlist.\n\nConfirm your email: ${confirmUrl}`,
  });
}

export async function sendWaitlistWelcome(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "You're on the Hugo waitlist",
    html: `
      <p>You're confirmed on the Hugo waitlist.</p>
      <p>Hugo detects ecommerce KPI breaches, runs AI investigation, and tracks recovery — so you act before the P&amp;L closes.</p>
      <p>We'll email you when early access opens.</p>
    `,
    text:
      "You're confirmed on the Hugo waitlist.\n\n" +
      "Hugo detects ecommerce KPI breaches, runs AI investigation, and tracks recovery.\n\n" +
      "We'll email you when early access opens.",
  });
}
