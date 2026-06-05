import { z } from "zod";

/** POST /api/learn accepts an empty JSON object (or no body). */
export const learnBodySchema = z.object({}).strict();

export type LearnBody = z.infer<typeof learnBodySchema>;
