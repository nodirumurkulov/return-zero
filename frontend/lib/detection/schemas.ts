import { z } from "zod";

export const recoverBodySchema = z.object({
  advance_days: z.number().finite().optional(),
});

export type RecoverBody = z.infer<typeof recoverBodySchema>;
