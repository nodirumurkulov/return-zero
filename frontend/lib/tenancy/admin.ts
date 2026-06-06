import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { TenancyError } from "./errors";
import { Tenancy } from "./tenancy";
import type { StoreScope } from "./types";

/** All organization ids (cron / seed with service role). */
export async function listAllOrganizationIds(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data, error } = await supabase.from("organizations").select("id");
  if (error) throw new TenancyError(error.message);
  return (data ?? []).map((row) => row.id);
}

/** Every store scope across all orgs — for cron schedulers. */
export async function listAllStoreScopes(
  supabase: SupabaseClient<Database>,
): Promise<StoreScope[]> {
  const tenancy = new Tenancy(supabase);
  const organizationIds = await listAllOrganizationIds(supabase);
  const storeLists = await Promise.all(
    organizationIds.map((organizationId) => tenancy.listStores({ organizationId })),
  );
  return organizationIds.flatMap((organizationId, index) =>
    (storeLists[index] ?? []).map((store) => ({
      organizationId,
      storeId: store.id,
    })),
  );
}
