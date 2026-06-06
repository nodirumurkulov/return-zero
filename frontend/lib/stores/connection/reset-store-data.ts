import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { ConnectionError } from "./errors";

export async function resolveActiveStoreId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("organizations")
    .select("active_store_id")
    .eq("id", organizationId)
    .single();
  if (error) throw new ConnectionError(`organizations read failed: ${error.message}`);
  if (!data.active_store_id) {
    throw new ConnectionError(`no active store for organization ${organizationId}`);
  }
  return data.active_store_id;
}

export async function resetStoreData(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
): Promise<void> {
  const { error } = await supabase.rpc("reset_store_data", {
    p_store_id: scope.storeId,
  });
  if (error) throw new ConnectionError(`reset_store_data: ${error.message}`);
}

/** Resolve active store for org, then reset — for callers without an explicit scope. */
export async function resetActiveStoreData(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<void> {
  const storeId = await resolveActiveStoreId(supabase, organizationId);
  await resetStoreData(supabase, { organizationId, storeId });
}
