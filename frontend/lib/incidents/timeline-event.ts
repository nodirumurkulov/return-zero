import type { Json } from "@/lib/supabase/database.types";

/** Timeline event row — matches Supabase `incident_timeline` table columns. */
export type TimelineEvent = {
  id: string;
  incident_id: string;
  event_type: string;
  description: string;
  metadata: Json | null;
  created_at: string;
};
