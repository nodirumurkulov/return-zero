import {
  lookupPricingSession,
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

  const lookup = await lookupPricingSession(parsed.data.token);

  if (lookup.status === "not_found") {
    return Response.json({ error: "Invalid waitlist token." }, { status: 404 });
  }

  if (lookup.status === "error") {
    const hint =
      process.env.NODE_ENV === "development"
        ? lookup.message
        : "Could not load pricing session. Try again.";
    return Response.json({ error: hint }, { status: 500 });
  }

  const { session } = lookup;

  if (session.signup.negotiation_status === "accepted" || session.signup.negotiation_status === "declined") {
    return Response.json({ error: "This pricing conversation is closed." }, { status: 409 });
  }

  const result = await runPricingNegotiationTurn(session, parsed.data.message);
  return result.toUIMessageStreamResponse();
}
