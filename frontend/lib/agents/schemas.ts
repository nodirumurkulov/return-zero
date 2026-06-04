import type { NextRequest } from "next/server";
import { z } from "zod";

import { parseRequestJson, type ParseJsonResult } from "@/lib/http/parse-json";

export const investigateBodySchema = z.object({
  incident_id: z.string().min(1),
  product_id: z.string().min(1),
});

export type InvestigateBody = z.infer<typeof investigateBodySchema>;

export function parseInvestigateBody(
  req: NextRequest,
): Promise<ParseJsonResult<InvestigateBody>> {
  return parseRequestJson(req, investigateBodySchema);
}
