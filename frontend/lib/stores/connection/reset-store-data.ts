import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { ConnectionError } from "./errors";

export async function resetActiveStoreData(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("organizations")
    .select("active_store_id")
    .eq("id", organizationId)
    .single();
  if (error) throw new ConnectionError(`organizations read failed: ${error.message}`);
  if (!data.active_store_id) {
    throw new ConnectionError(`no active store for organization ${organizationId}`);
  }

  const { error: resetError } = await supabase.rpc("reset_store_data", {
    p_store_id: data.active_store_id,
  });
  if (resetError) throw new ConnectionError(`reset_store_data: ${resetError.message}`);
}
