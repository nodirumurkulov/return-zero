import { NextResponse } from "next/server";
import { sendWaitlistWelcome } from "@/lib/email/send-waitlist";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmWaitlistSignup, markWelcomeSent } from "@/lib/waitlist/mutations";

function redirectUrl(status: string): URL {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(`/?waitlist=${status}#waitlist`, base);
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(redirectUrl("invalid"));
  }

  const result = await confirmWaitlistSignup(token).catch(() => "invalid" as const);

  if (result === "invalid") {
    return NextResponse.redirect(redirectUrl("invalid"));
  }

  if (result === "already") {
    return NextResponse.redirect(redirectUrl("already"));
  }

  const supabase = createAdminClient();
  const row = await supabase
    .from("waitlist_signups")
    .select("email, welcome_sent_at")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (row.data && !row.data.welcome_sent_at) {
    await sendWaitlistWelcome(row.data.email).catch(() => undefined);
    await markWelcomeSent(row.data.email).catch(() => undefined);
  }

  return NextResponse.redirect(redirectUrl("confirmed"));
}
