import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Tables } from "@/lib/supabase/db";

import { mockStore } from "./mock";
import { prettyFlyPack } from "./mock/pack";
import { shopifyStore } from "./shopify";

export type StorePlatform = Enums<"store_platform">;
export type StoreConnection = Tables<"store_connections">;

export interface LoadResult {
  table: string;
  count: number;
  error?: string;
}

export interface StoreLoadOpts {
  replace?: boolean;
}

export interface StoreConnector {
  readonly platform: StorePlatform;
  load(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
    opts?: StoreLoadOpts,
  ): Promise<LoadResult[]>;
  markConnected(supabase: SupabaseClient<Database>, organizationId: string): Promise<void>;
  connect(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
  ): Promise<{ results: LoadResult[]; success: boolean }>;
}

export async function connectorConnect(
  connector: Pick<StoreConnector, "load" | "markConnected">,
  supabase: SupabaseClient<Database>,
  organizationId: string,
  source: unknown,
): Promise<{ results: LoadResult[]; success: boolean }> {
  const results = await connector.load(supabase, organizationId, source, { replace: true });
  await connector.markConnected(supabase, organizationId);
  return { results, success: results.every((r) => !r.error) };
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

export const stores = {
  mock_csv: { connector: mockStore },
  shopify: { connector: shopifyStore },
} satisfies Record<StorePlatform, { connector: StoreConnector }>;

export async function connectStore(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  platform: StorePlatform,
  source?: unknown,
): Promise<{ results: LoadResult[]; success: boolean }> {
  if (platform === "shopify") throw new Error("Shopify is not available yet");

  const payload = platform === "mock_csv" ? (source ?? prettyFlyPack.read()) : source;
  return stores[platform].connector.connect(supabase, organizationId, payload);
}
