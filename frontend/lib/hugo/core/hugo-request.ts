export type HugoRequest = {
  prompt: string;
  organizationId: string;
  userName?: string;
};

export type HugoInvestigationRequest = {
  incidentId: string;
  productId: string;
};
