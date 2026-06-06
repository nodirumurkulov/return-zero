import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { logApiError } from "@/lib/api-errors";
import { getStore } from "@/lib/stores/server";
import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";


import { createShopifyAdminClient } from "./client";
import { ShopifyError } from "./errors";
import {
  hadShopifyConnectionBeforeOAuth,
  resolveOrganizationIdForUser,
  resolveShopLoginUser,
} from "./identity";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  verifyOAuthHmac,
} from "./oauth";
import { resolveOAuthRedirect } from "./redirect";
import { shopifyAuthQuerySchema, shopifyOAuthCallbackQuerySchema } from "./schemas";
import { establishSessionForEmail } from "./session";
import { normalizeShop } from "./shop";
import { fetchShopInfo } from "./shop-info";
import { createOAuthStateCookie, parseOAuthState } from "./state";
import type {
  BeginOAuthOpts,
  BeginOAuthResult,
  CompleteOAuthOpts,
  CompleteOAuthResult,
} from "./types";

const SIGN_IN_PATH = "/sign-in";
const DEFAULT_RETURN_TO = "/onboarding";

type OAuthIdentityResult =
  | {
      action: "ready";
      organizationId: string;
      sessionEmail: string | null;
      activateStore: boolean;
      hadSession: boolean;
    }
  | { action: "redirect"; url: string }
  | { action: "error"; message: string; status: number };

async function resolveOAuthIdentity(
  admin: SupabaseClient<Database>,
  opts: {
    sessionUserId?: string | null;
    intent: "login" | "connect";
    returnTo?: string;
    shopInfo: Awaited<ReturnType<typeof fetchShopInfo>>;
  },
): Promise<OAuthIdentityResult> {
  if (opts.sessionUserId) {
    const orgId = await resolveOrganizationIdForUser(admin, opts.sessionUserId);
    if (!orgId) {
      return { action: "error", message: "No organization membership found", status: 403 };
    }

    return {
      action: "ready",
      organizationId: orgId,
      sessionEmail: null,
      activateStore: false,
      hadSession: true,
    };
  }

  if (opts.intent === "login") {
    const resolved = await resolveShopLoginUser(admin, opts.shopInfo);
    return {
      action: "ready",
      organizationId: resolved.organizationId,
      sessionEmail: resolved.email,
      activateStore: resolved.isNew,
      hadSession: false,
    };
  }

  const next = opts.returnTo ?? DEFAULT_RETURN_TO;
  return {
    action: "redirect",
    url: `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`,
  };
}

export class ShopifyOAuth {
  constructor(
    private readonly admin: SupabaseClient<Database>,
    private readonly apiSecret: string,
  ) {}

  beginOAuth(opts: BeginOAuthOpts): BeginOAuthResult {
    const parsed = shopifyAuthQuerySchema.safeParse({
      shop: opts.query.shop,
      intent: opts.query.intent,
      returnTo: opts.query.returnTo,
    });

    if (!parsed.success) {
      return {
        action: "error",
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
        status: 400,
      };
    }

    const { intent, shop, returnTo } = parsed.data;

    if (intent === "connect" && !opts.sessionUserId) {
      const next = returnTo ?? DEFAULT_RETURN_TO;
      return {
        action: "redirect",
        url: `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`,
      };
    }

    const { myshopifyDomain } = normalizeShop(shop);
    const statePayload = {
      shop: myshopifyDomain,
      nonce: randomUUID(),
      intent,
      returnTo: returnTo ?? DEFAULT_RETURN_TO,
    };
    const cookie = createOAuthStateCookie(statePayload, this.apiSecret);
    const authorizeUrl = buildAuthorizeUrl({
      shop: myshopifyDomain,
      state: cookie.value,
      redirectUri: opts.callbackUrl,
    });

    return { action: "authorize", authorizeUrl, cookie };
  }

  async completeOAuth(opts: CompleteOAuthOpts): Promise<CompleteOAuthResult> {
    const parsedQuery = shopifyOAuthCallbackQuerySchema.safeParse({
      code: opts.query.code,
      hmac: opts.query.hmac,
      host: opts.query.host,
      shop: opts.query.shop,
      state: opts.query.state,
      timestamp: opts.query.timestamp,
    });

    if (!parsedQuery.success) {
      return {
        action: "error",
        message: parsedQuery.error.issues.map((issue) => issue.message).join("; "),
        status: 400,
      };
    }

    const query = parsedQuery.data;
    const hmacValid = await verifyOAuthHmac(query);
    if (!hmacValid) {
      return { action: "error", message: "Invalid OAuth signature", status: 403 };
    }

    const stateCookie = opts.stateCookieValue;
    if (!stateCookie || stateCookie !== query.state) {
      return { action: "error", message: "Invalid OAuth state", status: 400 };
    }

    const statePayload = parseOAuthState(stateCookie, this.apiSecret);
    if (!statePayload || statePayload.shop !== query.shop) {
      return { action: "error", message: "Invalid OAuth state", status: 400 };
    }

    try {
      const token = await exchangeCodeForToken({ shop: query.shop, code: query.code });
      const client = createShopifyAdminClient({
        shop: query.shop,
        accessToken: token.accessToken,
      });
      const shopInfo = await fetchShopInfo(client);
      const store = getStore(this.admin);

      const identity = await resolveOAuthIdentity(this.admin, {
        sessionUserId: opts.sessionUserId,
        intent: statePayload.intent,
        returnTo: statePayload.returnTo,
        shopInfo,
      });

      if (identity.action === "error") {
        return identity;
      }

      if (identity.action === "redirect") {
        return { ...identity, clearOAuthState: true };
      }

      const { organizationId, sessionEmail, activateStore, hadSession } = identity;

      const hadShopifyConnection = await hadShopifyConnectionBeforeOAuth(
        this.admin,
        organizationId,
        shopInfo.myshopifyDomain,
      );

      const connected = await store.connection.connectShopify({
        organizationId,
        externalShopId: shopInfo.myshopifyDomain,
        label: shopInfo.name,
        accessToken: token.accessToken,
        scopes: token.scope,
        activateStore: activateStore || !hadSession,
      });

      const scope: StoreScope = {
        organizationId,
        storeId: connected.storeId,
      };

      opts.scheduleBackgroundSync(async () => {
        try {
          const result = await store.import.runBackgroundImport({
            scope,
            platform: "shopify",
            replace: false,
          });
          if (result.success) {
            await store.orders.reset({ scope });
          }
        } catch (err) {
          logApiError("shopify/oauth-flow", err);
        }
      });

      if (!hadSession && sessionEmail) {
        await establishSessionForEmail(this.admin, opts.routeClient, sessionEmail);
      }

      const redirectPath = resolveOAuthRedirect({
        returnTo: statePayload.returnTo,
        hadShopifyConnection,
        intent: statePayload.intent,
      });

      return {
        action: "redirect",
        url: redirectPath,
        clearOAuthState: true,
      };
    } catch (err) {
      logApiError("shopify/oauth-flow", err);
      const message = err instanceof ShopifyError ? err.message : "Shopify OAuth callback failed";
      return { action: "error", message, status: 500 };
    }
  }
}

export function getShopifyOAuth(admin: SupabaseClient<Database>): ShopifyOAuth {
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    throw new ShopifyError("Shopify is not configured");
  }

  return new ShopifyOAuth(admin, apiSecret);
}
