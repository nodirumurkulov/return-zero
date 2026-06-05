import { z } from "zod";

import type { StorePlatform } from "@/lib/stores";

export const onboardingConnectBodySchema = z
  .object({
    platform: z.enum(["mock_csv", "shopify"] satisfies [StorePlatform, StorePlatform]),
  })
  .strict();

export const onboardingConnectResultSchema = z.object({
  table: z.string(),
  count: z.number(),
  error: z.string().optional(),
});

export const onboardingConnectSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    results: z.array(onboardingConnectResultSchema),
  })
  .strict();

export const onboardingConnectPartialResponseSchema = z
  .object({
    success: z.literal(false),
    results: z.array(onboardingConnectResultSchema),
  })
  .strict();

export const onboardingConnectResponseSchema = z.union([
  onboardingConnectSuccessResponseSchema,
  onboardingConnectPartialResponseSchema,
  z.object({ error: z.string() }),
]);

export type OnboardingConnectResponse = z.infer<typeof onboardingConnectResponseSchema>;
