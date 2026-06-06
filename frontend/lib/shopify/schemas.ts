import { z } from "zod";

import { authNextPathSchema } from "@/lib/auth/schemas";

const myshopifyHostSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
    "Shop must be a valid *.myshopify.com host",
  );

export const shopifyShopInputSchema = z.union([
  myshopifyHostSchema,
  z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/, "Shop handle must be alphanumeric"),
]);

export const shopifyNormalizedShopSchema = z
  .object({
    shop: z.string().min(1),
    myshopifyDomain: myshopifyHostSchema,
  })
  .strict();

export const shopifyOAuthIntentSchema = z.enum(["login", "connect"]);

export const shopifyOAuthStatePayloadSchema = z
  .object({
    shop: z.string().min(1),
    nonce: z.string().min(1),
    intent: shopifyOAuthIntentSchema,
    returnTo: authNextPathSchema.optional(),
  })
  .strict();

export const shopifyOAuthCallbackQuerySchema = z
  .object({
    code: z.string().min(1),
    hmac: z.string().min(1),
    host: z.string().optional(),
    shop: myshopifyHostSchema,
    state: z.string().min(1),
    timestamp: z.string().optional(),
  })
  .strict();

export const shopifyAccessTokenResponseSchema = z
  .object({
    access_token: z.string().min(1),
    scope: z.string(),
  })
  .strict();

export const shopifyAuthQuerySchema = z
  .object({
    shop: shopifyShopInputSchema,
    intent: shopifyOAuthIntentSchema,
    returnTo: authNextPathSchema.optional(),
  })
  .strict();
