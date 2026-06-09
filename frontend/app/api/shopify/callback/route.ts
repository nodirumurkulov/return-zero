import { after, type NextRequest, NextResponse } from "next/server";

import { getRequestIp, logSecurityEvent } from "@/lib/audit";
import {
  getShopifyOAuth,
  SHOPIFY_OAUTH_STATE_COOKIE,
} from "@/lib/shopify/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export const dynamic = "force-dynamic";

function clearOAuthStateCookie(response: NextResponse): void {
  response.cookies.set(SHOPIFY_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  if (!process.env.SHOPIFY_API_SECRET || !process.env.SHOPIFY_API_KEY) {
    return NextResponse.json({ error: "Shopify is not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const shopify = getShopifyOAuth(admin);
  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  const response = NextResponse.redirect(new URL("/onboarding", request.url));
  const routeClient = createRouteHandlerClient(request, response);
  const {
    data: { user },
  } = await routeClient.auth.getUser();

  const result = await shopify.completeOAuth({
    query: queryParams,
    stateCookieValue: request.cookies.get(SHOPIFY_OAUTH_STATE_COOKIE)?.value,
    sessionUserId: user?.id,
    routeClient,
    scheduleBackgroundSync: (fn) => {
      after(fn);
    },
  });

  if (result.action === "error") {
    void logSecurityEvent(admin, {
      user_id: user?.id,
      category: "auth",
      action: "shopify_oauth_failure",
      severity: "high",
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
      metadata: { shop: queryParams.shop, reason: result.message },
    });
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  void logSecurityEvent(admin, {
    user_id: user?.id,
    category: "auth",
    action: "shopify_oauth_success",
    severity: "low",
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
    metadata: { shop: queryParams.shop },
  });

  response.headers.set("Location", new URL(result.url, request.url).toString());
  if (result.clearOAuthState) {
    clearOAuthStateCookie(response);
  }

  return response;
}
