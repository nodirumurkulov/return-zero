import type { Json } from "@/lib/supabase/database.types";

/** Agent finding row — matches Supabase `agent_findings` table columns. */
export type AgentFinding = {
  id: string;
  incident_id: string;
  agent_name: string;
  agent_icon: string | null;
  summary: string;
  detail: Json | null;
  created_at: string;
};
