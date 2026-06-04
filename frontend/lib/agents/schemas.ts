import { z } from "zod";

export const investigateBodySchema = z.object({
  incident_id: z.string().min(1),
  product_id: z.string().min(1),
});

export type InvestigateBody = z.infer<typeof investigateBodySchema>;
