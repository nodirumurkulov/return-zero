import type { Database } from "@/lib/supabase/database.types";

export type TimelineEvent = Database["public"]["Tables"]["incident_timeline"]["Row"];
