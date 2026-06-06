import { NextResponse } from "next/server";
import {
  formatUsdFromCents,
  getPricingSession,
  maskEmail,
  marketingTiers,
  pricingSessionQuerySchema,
  seedOpeningAssistantMessage,
} from "@/lib/waitlist-pricing";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const parsed = pricingSessionQuerySchema.safeParse({ token });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 },
    );
  }

  const session = await getPricingSession(parsed.data.token).catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Invalid or unconfirmed waitlist token." }, { status: 404 });
  }

  const openingMessage =
    session.messages.length === 0
      ? await seedOpeningAssistantMessage(session.signup.id).catch(() => null)
      : null;

  const messages =
    openingMessage !== null
      ? [
          ...session.messages,
          {
            id: "opening",
            role: "assistant" as const,
            content: openingMessage,
            created_at: new Date().toISOString(),
          },
        ]
      : session.messages;

  return NextResponse.json({
    email: maskEmail(session.signup.email),
    negotiationStatus: session.signup.negotiation_status,
    selectedTier: session.signup.selected_tier,
    agreedPriceCents: session.signup.agreed_price_cents,
    offeredPriceCents: session.signup.offered_price_cents,
    negotiationCompletedAt: session.signup.negotiation_completed_at,
    state: session.state,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    })),
    tierCatalog: marketingTiers(),
    agreedPriceLabel:
      session.signup.agreed_price_cents !== null
        ? formatUsdFromCents(session.signup.agreed_price_cents)
        : null,
  });
}
