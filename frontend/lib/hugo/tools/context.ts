import type { HugoSupabase } from "../types";

export type HugoToolContext = {
  supabase: HugoSupabase;
  organizationId: string;
};
