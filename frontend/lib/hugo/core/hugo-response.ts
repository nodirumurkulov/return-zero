export type HugoResponse = {
  text: string;
};

export type HugoInvestigationResponse = {
  root_cause: string;
  root_cause_confidence: number;
  findings_count: number;
  actions_count: number;
};
