import { z } from "zod";

export const replayBodySchema = z.object({
  advance_days: z.number().finite().positive().optional(),
  reset: z.boolean().optional(),
});

export type ReplayBody = z.infer<typeof replayBodySchema>;

export interface ReplayOpts {
  organizationId: string;
  advanceDays?: number;
}
