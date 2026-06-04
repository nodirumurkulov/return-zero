import type { NextRequest } from "next/server";
import { z } from "zod";

import { parseRequestJson, type ParseJsonResult } from "@/lib/http/parse-json";

export const approveIncidentBodySchema = z.object({
  action_ids: z.array(z.string().min(1)).optional(),
  approve_all_low_risk: z.boolean().optional(),
  approved_by: z.string().min(1).optional(),
});

export type ApproveIncidentBody = z.infer<typeof approveIncidentBodySchema>;

export function parseApproveIncidentBody(
  req: NextRequest,
): Promise<ParseJsonResult<ApproveIncidentBody>> {
  return parseRequestJson(req, approveIncidentBodySchema);
}
