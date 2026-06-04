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

export type AgentSupabase = SupabaseClient<Database>;
