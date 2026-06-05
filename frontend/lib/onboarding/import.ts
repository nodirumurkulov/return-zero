import type { SupabaseClient } from "@supabase/supabase-js";

import { loadContractData, type LoadResult } from "./contract-loader";

export type { LoadResult as ImportResult } from "./contract-loader";
export { parseCsv } from "./contract-loader";

/**
 * Import uploaded CSVs into org-scoped contract tables.
 * Delegates to loadContractData (two-pass FK resolution + upsert on external_id).
 */
export async function importContractData(
  supabase: SupabaseClient,
  organizationId: string,
  files: Record<string, string>,
  opts: { replace?: boolean } = {},
): Promise<LoadResult[]> {
  return loadContractData(supabase, organizationId, files, opts);
}
