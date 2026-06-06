import "server-only";

import type { AuthQuery, BeginParams, CallbackParams } from "@shopify/shopify-api";

import { getShopifyApi } from "./config";
import { ShopifyError } from "./errors";
import { normalizeShop } from "./shop";

export function buildAuthorizeUrl(opts: {
  shop: string;
  state: string;
  redirectUri: string;
  apiKey?: string;
  scopes?: string;
}): string {
  const { myshopifyDomain } = normalizeShop(opts.shop);
  const shopify = getShopifyApi();
  const apiKey = opts.apiKey ?? shopify.config.apiKey;
  const scope = opts.scopes ?? shopify.config.scopes?.toString() ?? "";

  const params = new URLSearchParams({
    client_id: apiKey,
    scope,
    redirect_uri: opts.redirectUri,
    state: opts.state,
  });

  return `https://${myshopifyDomain}/admin/oauth/authorize?${params.toString()}`;
}

export async function verifyOAuthHmac(
  query: Record<string, string | undefined>,
): Promise<boolean> {
  const hmac = query.hmac;
  if (!hmac) {
    return false;
  }

  const authQuery = Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, value] as const],
    ),
  ) as AuthQuery;

  try {
    return await getShopifyApi().utils.validateHmac(authQuery);
  } catch {
    return false;
  }
}

export async function exchangeCodeForToken(opts: {
  shop: string;
  code: string;
}): Promise<{ accessToken: string; scope: string }> {
  const shopify = getShopifyApi();
  const { myshopifyDomain } = normalizeShop(opts.shop);

  const response = await fetch(`https://${myshopifyDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: shopify.config.apiKey,
      client_secret: shopify.config.apiSecretKey,
      code: opts.code,
    }),
  });

  if (!response.ok) {
    throw new ShopifyError(`Shopify token exchange failed (${response.status})`);
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("access_token" in body) ||
    typeof body.access_token !== "string" ||
    !("scope" in body) ||
    typeof body.scope !== "string"
  ) {
    throw new ShopifyError("Shopify token exchange returned invalid payload");
  }

  return {
    accessToken: body.access_token,
    scope: body.scope,
  };
}

/** Redirect merchant to Shopify OAuth (sets SDK state cookie on rawResponse). */
export async function beginShopifyOAuth(params: BeginParams) {
  /* SDK AdapterResponse is typed as `any` in @shopify/shopify-api */
  /* eslint-disable @typescript-eslint/no-unsafe-return -- passthrough to shopify.auth.begin */
  return getShopifyApi().auth.begin({
    ...params,
    isOnline: params.isOnline ?? false,
  });
  /* eslint-enable @typescript-eslint/no-unsafe-return */
}

/** Complete OAuth callback; returns SDK session with access token. */
export async function completeShopifyOAuth(params: CallbackParams) {
  const callback = await getShopifyApi().auth.callback(params);
  return callback;
}
