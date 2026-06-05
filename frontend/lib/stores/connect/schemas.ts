import { z } from "zod";

export const connectResultSchema = z.object({
  table: z.string(),
  count: z.number(),
  error: z.string().optional(),
});

export const connectSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    results: z.array(connectResultSchema),
  })
  .strict();

export const connectPartialResponseSchema = z
  .object({
    success: z.literal(false),
    results: z.array(connectResultSchema),
  })
  .strict();

export const connectResponseSchema = z.union([
  connectSuccessResponseSchema,
  connectPartialResponseSchema,
  z.object({ error: z.string() }),
]);

export type ConnectResponse = z.infer<typeof connectResponseSchema>;
