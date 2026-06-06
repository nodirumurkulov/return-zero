import { z } from "zod";

export const waitlistBodySchema = z.object({
  email: z.string().trim().email(),
  website: z.string().max(0).optional(),
});

export type WaitlistBody = z.infer<typeof waitlistBodySchema>;
