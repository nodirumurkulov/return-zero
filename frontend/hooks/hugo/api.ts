import type { IncidentRef } from "@/types/incidents";

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
  const res = await fetch("/api/investigate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incident_id: input.incident.id,
      product_id: input.product.id,
    }),
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Investigation failed");
  }
  return { investigation: { success: true } };
}
