import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** LLM output from a single investigation agent (not the persisted DB row). */
export type LlmAgentFinding = {
  agent_name: string;
  agent_icon: string;
  summary: string;
  detail: Record<string, unknown>;
};

export type InvestigationAction = {
  title: string;
  description: string;
  impact_level: "high" | "medium" | "low";
  risk_level: "high" | "medium" | "low";
  auto_deploy: boolean;
};

export type InvestigationResult = {
  findings: LlmAgentFinding[];
  root_cause: string;
  root_cause_confidence: number;
  actions: InvestigationAction[];
};

export type Confidence = "high" | "moderate" | "low" | "none";

/** One dimension of the Quant Analyst's diagnosis. */
export type QuantFinding = {
  agent_name: string;
  agent_icon: string;
  summary: string;
  z_score?: number | null;
  sigma?: number | null;
  ci?: { lower: number; upper: number } | null;
  confidence?: Confidence | null;
  quantity?: number | null;
  detail: Record<string, unknown>;
};

export type QuantDiagnosis = {
  findings: QuantFinding[];
};

/** A costed, goal-aligned recommendation from the Operator. */
export type OperatorAction = InvestigationAction & {
  goal_rationale?: string | null;
  estimated_impact_gbp?: number | null;
  confidence?: Confidence | null;
};

export type OperatorOutput = {
  root_cause: string;
  root_cause_confidence: number;
  actions: OperatorAction[];
};

export type AgentSupabase = SupabaseClient<Database>;
