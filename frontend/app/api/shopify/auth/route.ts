import { type NextRequest, NextResponse } from "next/server";

import { getShopifyOAuth } from "@/lib/shopify/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function shopifyCallbackUrl(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  return `${appUrl.replace(/\/$/, "")}/api/shopify/callback`;
}

export async function GET(request: NextRequest) {
  if (!process.env.SHOPIFY_API_SECRET || !process.env.SHOPIFY_API_KEY) {
    return NextResponse.json({ error: "Shopify is not configured" }, { status: 503 });
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shopify = getShopifyOAuth(createAdminClient());
  const result = shopify.beginOAuth({
    query,
    sessionUserId: user?.id,
    callbackUrl: shopifyCallbackUrl(request),
  });

  if (result.action === "error") {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  if (result.action === "redirect") {
    return NextResponse.redirect(new URL(result.url, request.url));
  }

  const response = NextResponse.redirect(result.authorizeUrl);
  response.cookies.set(result.cookie.name, result.cookie.value, result.cookie.options);
  return response;
}
