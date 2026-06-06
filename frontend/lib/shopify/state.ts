import { createHmac, timingSafeEqual } from "node:crypto";

import { shopifyOAuthStatePayloadSchema } from "./schemas";

export const SHOPIFY_OAUTH_STATE_COOKIE = "shopify_oauth_state";

export type OAuthStatePayload = {
  shop: string;
  nonce: string;
  returnTo?: string;
};

export type OAuthStateCookie = {
  name: typeof SHOPIFY_OAUTH_STATE_COOKIE;
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
};

function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function signOAuthState(payload: OAuthStatePayload, secret: string): string {
  const parsed = shopifyOAuthStatePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Invalid OAuth state payload");
  }

  const body = Buffer.from(JSON.stringify(parsed.data)).toString("base64url");
  return `${signPayload(body, secret)}.${body}`;
}

export function parseOAuthState(value: string, secret: string): OAuthStatePayload | null {
  const separator = value.indexOf(".");
  if (separator <= 0) {
    return null;
  }

  const signature = value.slice(0, separator);
  const body = value.slice(separator + 1);
  if (!signature || !body) {
    return null;
  }

  const expected = signPayload(body, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const parsedJson: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  const parsed = shopifyOAuthStatePayloadSchema.safeParse(parsedJson);
  return parsed.success ? parsed.data : null;
}

export function createOAuthStateCookie(
  payload: OAuthStatePayload,
  secret: string,
): OAuthStateCookie {
  return {
    name: SHOPIFY_OAUTH_STATE_COOKIE,
    value: signOAuthState(payload, secret),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  };
}
