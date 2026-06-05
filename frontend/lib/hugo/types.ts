import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type HugoSupabase = SupabaseClient<Database>;

/** LLM output from Hugo investigation (not the persisted DB row). */
export type HugoFinding = {
  agent_name: string;
  agent_icon: string;
  summary: string;
  detail: Record<string, unknown>;
};

export type HugoAction = {
  title: string;
  description: string;
  impact_level: "high" | "medium" | "low";
  risk_level: "high" | "medium" | "low";
  auto_deploy: boolean;
};

export type HugoInvestigationResult = {
  findings: HugoFinding[];
  root_cause: string;
  root_cause_confidence: number;
  actions: HugoAction[];
};

export type PersistInvestigationResult = {
  result: HugoInvestigationResult;
  findings_count: number;
  actions_count: number;
};
