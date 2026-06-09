import { type NextRequest, NextResponse } from "next/server";
import { hasCronAuth, matchesCronPath } from "@/lib/cron-auth";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = [
  "/",
  "/features",
  "/pricing",
  "/blog",
  "/sign-in",
  "/sign-up",
  "/auth/callback",
  "/api/waitlist",
  "/api/waitlist/confirm",
  "/api/waitlist/pricing",
  "/waitlist/pricing",
  "/api/slack/webhook",
  "/api/slack/events",
  "/api/shopify/auth",
  "/api/shopify/callback",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectWithCookies(url: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export default async function proxy(request: NextRequest) {
  if (matchesCronPath(request.nextUrl.pathname) && hasCronAuth(request)) {
    return NextResponse.next();
  }

  const csrf = verifyCsrfOrigin(request);
  if (!csrf.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
