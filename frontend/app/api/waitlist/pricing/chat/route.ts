import {
  getPricingSession,
  pricingChatBodySchema,
  runPricingNegotiationTurn,
} from "@/lib/waitlist-pricing";

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = pricingChatBodySchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 },
    );
  }

  const session = await getPricingSession(parsed.data.token).catch(() => null);
  if (!session) {
    return Response.json({ error: "Invalid waitlist token." }, { status: 404 });
  }

  if (session.signup.negotiation_status === "accepted" || session.signup.negotiation_status === "declined") {
    return Response.json({ error: "This pricing conversation is closed." }, { status: 409 });
  }

  const result = runPricingNegotiationTurn(session, parsed.data.message);
  return result.toUIMessageStreamResponse();
}
