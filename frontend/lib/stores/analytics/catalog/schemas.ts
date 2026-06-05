import { z } from "zod";

export const updateThresholdBodySchema = z
  .object({
    metric_key: z.string().min(1),
    threshold: z.number().finite(),
  })
  .strict();

export type UpdateThresholdBody = z.infer<typeof updateThresholdBodySchema>;

export const updateThresholdResponseSchema = z.object({ ok: z.literal(true) }).strict();
