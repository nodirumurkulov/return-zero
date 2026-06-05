import type { Tables } from "@/lib/supabase/db";

export type Incident = Tables<"incidents">;

export type IncidentRef = Pick<Incident, "id">;
