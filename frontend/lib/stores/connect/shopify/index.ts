import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";

import type { LoadResult, StoreConnector, StoreConnectorLoadOpts } from "..";

export class ShopifyStore implements StoreConnector {
  readonly platform = "shopify" as const;

  load(
    _supabase: SupabaseClient<Database>,
    _organizationId: string,
    _source: unknown,
    _opts?: StoreConnectorLoadOpts,
  ): Promise<LoadResult[]> {
    return Promise.reject(new Error("Shopify is not implemented yet"));
  }

  async markConnected(supabase: SupabaseClient<Database>, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from("store_connections")
      .update({
        platform: "shopify",
        status: "connected",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (error) throw new Error(`store_connections update: ${error.message}`);
  }
}

export const shopifyStore = new ShopifyStore();
