import type { SupabaseClient } from "@supabase/supabase-js";

import { learnBaselines } from "@/lib/learn/baselines";
import { buildBusinessReport } from "@/lib/learn/report";
import { createReplay } from "@/lib/stores/analytics/replay";
import type { Database } from "@/lib/supabase/db";

import { mockStore } from "./mock";
import { prettyFlyPack } from "./mock/pack";
import { shopifyStore } from "./shopify";
import type { LoadResult, StoreConnector, StorePlatform } from "./store-connector";

export const stores = {
  mock_csv: { connector: mockStore },
  shopify: { connector: shopifyStore },
} satisfies Record<StorePlatform, { connector: StoreConnector }>;

export async function getStoreConnection(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("store_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(`store_connections read failed: ${error.message}`);
  return data;
}

export async function markStoreConnected(
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

export async function connectStore(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  platform: StorePlatform,
  source?: unknown,
): Promise<{ results: LoadResult[]; success: boolean }> {
  if (platform === "shopify") throw new Error("Shopify is not available yet");

  const connector = stores[platform].connector;
  const payload = platform === "mock_csv" ? (source ?? prettyFlyPack.read()) : source;
  const results = await connector.load(supabase, organizationId, payload, { replace: true });
  await connector.markConnected(supabase, organizationId);
  return { results, success: results.every((r) => !r.error) };
}

export async function runStoreIntelligence(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const learn = await learnBaselines(supabase, organizationId);
  const report = await buildBusinessReport(supabase, organizationId);
  const { cursor } = await createReplay(supabase).reset(organizationId);
  return { learn, reportId: report.id, replayCursor: cursor };
}
