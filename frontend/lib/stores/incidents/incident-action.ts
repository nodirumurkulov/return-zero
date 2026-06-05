import type { Database } from "@/lib/supabase/database.types";

export type IncidentAction = Database["public"]["Tables"]["incident_actions"]["Row"];
