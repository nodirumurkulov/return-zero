import { z } from "zod";

export const approveIncidentBodySchema = z.object({
  action_ids: z.array(z.string().min(1)).optional(),
  approve_all_low_risk: z.boolean().optional(),
  approved_by: z.string().min(1).optional(),
});

export type ApproveIncidentBody = z.infer<typeof approveIncidentBodySchema>;
