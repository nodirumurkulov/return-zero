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

  const result = await insertWaitlistSignup(parsed.data.email).catch(() => null);

  if (!result) {
    return NextResponse.json({ error: "Could not join waitlist. Try again." }, { status: 500 });
  }

  if (result.status === "exists_confirmed") {
    return NextResponse.json({ ok: true, message: "already_confirmed" });
  }

  const token =
    result.status === "created" || result.status === "exists_unconfirmed"
      ? result.confirmationToken
      : null;

  if (token) {
    await sendWaitlistConfirmation(parsed.data.email, token).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
