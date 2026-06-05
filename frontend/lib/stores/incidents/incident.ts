import type { Database } from "@/lib/supabase/database.types";

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
