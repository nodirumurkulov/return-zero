import { investigateResponseSchema } from "@/lib/agents/schemas";
import type { IncidentRef } from "@/types/incidents";

import { apiClient } from "../client";

export type ProductRef = {
  readonly id: string;
};

export type TriggerInvestigationInput = {
  readonly incident: IncidentRef;
  readonly product: ProductRef;
};

export type TriggerInvestigationResult = {
  readonly investigation: { readonly success: true };
};

export async function triggerInvestigation(
  input: TriggerInvestigationInput,
): Promise<TriggerInvestigationResult> {
  await apiClient("/api/investigate", {
    method: "POST",
    body: {
      incident_id: input.incident.id,
      product_id: input.product.id,
    },
    output: investigateResponseSchema,
  });
  return { investigation: { success: true } };
}
