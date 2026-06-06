import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import {
  buildAuthorizeUrl,
  createOAuthStateCookie,
  normalizeShop,
  shopifyAuthQuerySchema,
  signOAuthState,
} from "@/lib/shopify/server";

export const dynamic = "force-dynamic";

function shopifyCallbackUrl(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  return `${appUrl.replace(/\/$/, "")}/api/shopify/callback`;
}

export function GET(request: NextRequest) {
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret || !process.env.SHOPIFY_API_KEY) {
    return NextResponse.json({ error: "Shopify is not configured" }, { status: 503 });
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = shopifyAuthQuerySchema.safeParse({
    shop: query.shop,
    returnTo: query.returnTo,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 },
    );
  }

  const { myshopifyDomain } = normalizeShop(parsed.data.shop);
  const nonce = randomUUID();
  const statePayload = {
    shop: myshopifyDomain,
    nonce,
    returnTo: parsed.data.returnTo,
  };
  const state = signOAuthState(statePayload, apiSecret);
  const cookie = createOAuthStateCookie(statePayload, apiSecret);
  const authorizeUrl = buildAuthorizeUrl({
    shop: myshopifyDomain,
    state,
    redirectUri: shopifyCallbackUrl(request),
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
