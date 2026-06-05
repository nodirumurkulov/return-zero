import { z } from "zod";

export const storePlatformSchema = z.enum(["mock_csv", "shopify"]);

export const importResultSchema = z.object({
  table: z.string(),
  count: z.number(),
  error: z.string().optional(),
});

export const importSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    results: z.array(importResultSchema),
  })
  .strict();

export const importPartialResponseSchema = z
  .object({
    success: z.literal(false),
    results: z.array(importResultSchema),
  })
  .strict();

export const importResponseSchema = z.union([
  importSuccessResponseSchema,
  importPartialResponseSchema,
  z.object({ error: z.string() }),
]);

export type ImportResponse = z.infer<typeof importResponseSchema>;
