import { type NextRequest, NextResponse } from "next/server";
import { AUTH_NEXT_DEFAULT, authNextPathSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParsed = authNextPathSchema.safeParse(searchParams.get("next"));
  const next = nextParsed.success ? nextParsed.data : AUTH_NEXT_DEFAULT;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
