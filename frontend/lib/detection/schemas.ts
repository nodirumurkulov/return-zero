import type { NextRequest } from "next/server";
import { z } from "zod";

import { parseRequestJson, type ParseJsonResult } from "@/lib/http/parse-json";

export const recoverBodySchema = z.object({
  advance_days: z.number().finite().optional(),
});

export type RecoverBody = z.infer<typeof recoverBodySchema>;

export function parseRecoverBody(req: NextRequest): Promise<ParseJsonResult<RecoverBody>> {
  return parseRequestJson(req, recoverBodySchema);
}
