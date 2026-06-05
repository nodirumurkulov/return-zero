import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { ExternalIdTable } from "./loaders/csv";
import { MockImportLoader } from "./mock";
import { prettyFlyPack, type PrettyFlyFiles } from "./mock/pack";
import type { ImportRunResult, StorePlatform } from "./types";

export type ProvisionMockCsvOpts = {
  organizationId: string;
  source?: PrettyFlyFiles;
  replace?: boolean;
};

const mockLoader = new MockImportLoader();

export async function provisionMockCsvStore(
  supabase: SupabaseClient<Database>,
  opts: ProvisionMockCsvOpts,
): Promise<ImportRunResult> {
  const source = opts.source ?? prettyFlyPack.read();
  const results = await mockLoader.load(supabase, opts.organizationId, source, {
    replace: opts.replace ?? true,
  });
  await markStoreImported(supabase, opts.organizationId, "mock_csv");
  return { results, success: results.every((result) => !result.error) };
}

export async function fetchProductExternalIdMap(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  table: ExternalIdTable = "products",
): Promise<Map<string, string>> {
  return mockLoader.fetchExternalIdMap(supabase, table, organizationId);
}

export async function markStoreImported(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  platform: StorePlatform,
): Promise<void> {
  const { error } = await supabase
    .from("store_connections")
    .update({
      platform,
      status: "connected",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);
  if (error) throw new Error(`store_connections update failed: ${error.message}`);
}
