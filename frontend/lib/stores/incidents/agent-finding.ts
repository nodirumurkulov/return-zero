import type { Database } from "@/lib/supabase/database.types";

export type AgentFinding = Database["public"]["Tables"]["agent_findings"]["Row"];
