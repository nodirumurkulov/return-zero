import { z } from "zod";

export const platformSchema = z.enum(["shopify", "woocommerce", "other"]);
export const primaryGoalSchema = z.enum(["growth", "margin", "cash"]);

export const businessProfileInputSchema = z
  .object({
    platform: platformSchema,
    storeName: z.string().trim().min(1, "Store name is required").max(120),
    primaryGoal: primaryGoalSchema,
    targetMarginPct: z.number().min(1).max(99),
    minRoas: z.number().min(0.1).max(20),
    leadTimeDays: z.number().int().min(1).max(365),
    bufferDays: z.number().int().min(0).max(90),
    heroProductIds: z.array(z.string()).max(20).default([]),
    productCosts: z
      .array(
        z.object({
          productId: z.string().min(1),
          costPerUnit: z.number().min(0),
        }),
      )
      .max(500)
      .default([]),
  })
  .strict();

export const businessProfileResponseSchema = z.object({
  profile: z.object({
    platform: platformSchema,
    storeName: z.string(),
    primaryGoal: primaryGoalSchema,
    targetMarginPct: z.number(),
    minRoas: z.number(),
    leadTimeDays: z.number(),
    bufferDays: z.number(),
    heroProductIds: z.array(z.string()),
  }),
  productCosts: z.array(
    z.object({
      productId: z.string(),
      title: z.string(),
      defaultCost: z.number().nullable(),
      costPerUnit: z.number(),
    }),
  ),
});

export const saveProfileSuccessSchema = z.object({
  success: z.literal(true),
});

export type BusinessProfileInput = z.infer<typeof businessProfileInputSchema>;
