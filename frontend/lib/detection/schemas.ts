import { z } from "zod";

export const recoverBodySchema = z.object({
  advance_days: z.number().finite().optional(),
});

export type RecoverBody = z.infer<typeof recoverBodySchema>;

export const replayBodySchema = z.object({
  advance_days: z.number().finite().positive().optional(),
  reset: z.boolean().optional(),
});

export type ReplayBody = z.infer<typeof replayBodySchema>;
