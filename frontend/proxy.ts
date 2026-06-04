import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/auth/callback", "/api/slack/webhook"];
const CRON_PATHS = ["/api/detect", "/api/forecast", "/api/recover"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasCronAuth(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || auth === secret;
}

function redirectWithCookies(url: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export default async function proxy(request: NextRequest) {
  if (matchesPrefix(request.nextUrl.pathname, CRON_PATHS) && hasCronAuth(request)) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (matchesPrefix(request.nextUrl.pathname, PUBLIC_PREFIXES)) {
    return response;
  }

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", request.nextUrl.pathname);
    return redirectWithCookies(signIn, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
