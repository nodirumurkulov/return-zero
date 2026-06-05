import { z } from "zod";

/** POST /api/learn accepts an empty JSON object (or no body). */
export const learnBodySchema = z.object({}).strict();

export type LearnBody = z.infer<typeof learnBodySchema>;

export const learnResponseSchema = z.union([
  z.object({ success: z.literal(true) }).strict(),
  z.object({ success: z.literal(false), error: z.string() }).strict(),
  z.object({ error: z.string() }).strict(),
]);
