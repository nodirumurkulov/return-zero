import { z } from "zod";

export const onboardingUploadResultSchema = z.object({
  table: z.string(),
  count: z.number(),
  error: z.string().optional(),
});

export const onboardingUploadSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    results: z.array(onboardingUploadResultSchema),
  })
  .strict();

export const onboardingUploadPartialResponseSchema = z
  .object({
    success: z.literal(false),
    results: z.array(onboardingUploadResultSchema),
  })
  .strict();

export const onboardingUploadResponseSchema = z.union([
  onboardingUploadSuccessResponseSchema,
  onboardingUploadPartialResponseSchema,
  z.object({ error: z.string() }),
]);

export type OnboardingUploadResponse = z.infer<typeof onboardingUploadResponseSchema>;
