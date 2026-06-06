import {
  investigationStepsResponseSchema,
  type InvestigationStepsResponse,
} from "@/lib/agents/schemas";

import { apiClient } from "../client";

export async function fetchInvestigationSteps(
  incidentId: string,
): Promise<InvestigationStepsResponse> {
  return apiClient(`/api/incidents/${incidentId}/investigation-steps`, {
    method: "GET",
    output: investigationStepsResponseSchema,
  });
}
