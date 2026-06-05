import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { persistInvestigation, type PersistInvestigationResult } from "@/lib/agents";
import type { CreatedIncident } from "@/lib/stores";
import type { Database } from "@/lib/supabase/database.types";

export async function investigateIncident(
  supabase: SupabaseClient<Database>,
  incidentId: string,
  productId: string,
): Promise<PersistInvestigationResult> {
  return persistInvestigation(supabase, incidentId, productId);
}

export async function investigateCreatedIncidents(
  supabase: SupabaseClient<Database>,
  created: readonly CreatedIncident[],
): Promise<void> {
  const withProduct = created.filter((inc) => inc.product_id);
  await Promise.allSettled(
    withProduct.map((inc) => investigateIncident(supabase, inc.incident_id, inc.product_id)),
  );
}
