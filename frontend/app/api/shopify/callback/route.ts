import { after, type NextRequest, NextResponse } from "next/server";

import { logApiError } from "@/lib/api-errors";
import { AUTH_NEXT_DEFAULT } from "@/lib/auth/schemas";
import {
  createShopifyAdminClient,
  exchangeCodeForToken,
  fetchShopInfo,
  parseOAuthState,
  SHOPIFY_OAUTH_STATE_COOKIE,
  shopifyOAuthCallbackQuerySchema,
  verifyOAuthHmac,
} from "@/lib/shopify/server";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createMagicLinkSession,
  ensureShopOwnerOrg,
  ensureShopOwnerUser,
} from "@/lib/tenancy/server";
import type { StoreScope } from "@/lib/tenancy/types";

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

function redirectWithClearedState(url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  clearOAuthStateCookie(response);
  return response;
}

async function resolveAuthenticatedOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.organization_id ?? null;
}

function queueBackgroundShopifySync(scope: StoreScope): void {
  after(async () => {
    try {
      const admin = createAdminClient();
      const store = getStore(admin);
      const result = await store.import.runBackgroundImport({
        scope,
        platform: "shopify",
        replace: false,
      });
      if (result.success) {
        await store.orders.reset({ scope });
      }
    } catch (err) {
      logApiError("api/shopify/callback", err);
    }
  });
}

export async function GET(request: NextRequest) {
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ error: "Shopify is not configured" }, { status: 503 });
  }

  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedQuery = shopifyOAuthCallbackQuerySchema.safeParse({
    code: queryParams.code,
    hmac: queryParams.hmac,
    host: queryParams.host,
    shop: queryParams.shop,
    state: queryParams.state,
    timestamp: queryParams.timestamp,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 },
    );
  }

  const query = parsedQuery.data;
  const hmacValid = await verifyOAuthHmac(query);
  if (!hmacValid) {
    return NextResponse.json({ error: "Invalid OAuth signature" }, { status: 403 });
  }

  const stateCookie = request.cookies.get(SHOPIFY_OAUTH_STATE_COOKIE)?.value;
  if (!stateCookie || stateCookie !== query.state) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const statePayload = parseOAuthState(stateCookie, apiSecret);
  if (!statePayload || statePayload.shop !== query.shop) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    const token = await exchangeCodeForToken({ shop: query.shop, code: query.code });
    const client = createShopifyAdminClient({
      shop: query.shop,
      accessToken: token.accessToken,
    });
    const shopInfo = await fetchShopInfo(client);
    const admin = createAdminClient();
    const store = getStore(admin);
    const returnTo = statePayload.returnTo ?? AUTH_NEXT_DEFAULT;

    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (user) {
      const organizationId = await resolveAuthenticatedOrganizationId(user.id);
      if (!organizationId) {
        return NextResponse.json({ error: "No organization membership found" }, { status: 403 });
      }

      const connected = await store.connection.connectShopify({
        organizationId,
        externalShopId: shopInfo.myshopifyDomain,
        label: shopInfo.name,
        accessToken: token.accessToken,
        scopes: token.scope,
      });

      const scope: StoreScope = {
        organizationId,
        storeId: connected.storeId,
      };
      queueBackgroundShopifySync(scope);

      return redirectWithClearedState(new URL(returnTo, request.url));
    }

    const userId = await ensureShopOwnerUser(admin, shopInfo.email);
    const organizationId = await ensureShopOwnerOrg(admin, userId, shopInfo.name);
    const connected = await store.connection.connectShopify({
      organizationId,
      externalShopId: shopInfo.myshopifyDomain,
      label: shopInfo.name,
      accessToken: token.accessToken,
      scopes: token.scope,
      activateStore: true,
    });

    const scope: StoreScope = {
      organizationId,
      storeId: connected.storeId,
    };
    queueBackgroundShopifySync(scope);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const redirectTo = `${appUrl.replace(/\/$/, "")}${returnTo}`;
    const magicLink = await createMagicLinkSession(admin, shopInfo.email, redirectTo);

    return redirectWithClearedState(new URL(magicLink));
  } catch (err) {
    logApiError("api/shopify/callback", err);
    return NextResponse.json({ error: "Shopify OAuth callback failed" }, { status: 500 });
  }
}
