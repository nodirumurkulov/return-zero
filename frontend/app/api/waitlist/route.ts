import { NextResponse } from "next/server";
import { sendWaitlistConfirmation } from "@/lib/email/send-waitlist";
import { insertWaitlistSignup } from "@/lib/waitlist/mutations";
import { waitlistBodySchema } from "@/lib/waitlist/schemas";

export async function POST(req: Request) {
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = waitlistBodySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const insertResult = await insertWaitlistSignup(parsed.data.email).then(
    (result) => ({ ok: true as const, result }),
    (error: unknown) => ({ ok: false as const, message: error instanceof Error ? error.message : "unknown error" }),
  );

  if (!insertResult.ok) {
    const hint =
      process.env.NODE_ENV === "development"
        ? insertResult.message
        : "Could not join waitlist. Try again.";
    return NextResponse.json({ error: hint }, { status: 500 });
  }

  const result = insertResult.result;
  const pricingToken =
    result.status === "created" ||
    result.status === "exists_unconfirmed" ||
    result.status === "exists_confirmed"
      ? result.confirmationToken
      : null;

  if (result.status === "created" || result.status === "exists_unconfirmed") {
    await sendWaitlistConfirmation(parsed.data.email, result.confirmationToken).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    pricingToken,
    alreadyConfirmed: result.status === "exists_confirmed",
  });
}
