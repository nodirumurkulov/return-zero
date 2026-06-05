import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";


import {
  connectorConnect,
  markStoreConnected,
  type LoadResult,
  type StoreConnector,
  type StoreLoadOpts,
} from "..";

export class ShopifyStore implements StoreConnector {
  readonly platform = "shopify" as const;

  load(
    _supabase: SupabaseClient<Database>,
    _organizationId: string,
    _source: unknown,
    _opts?: StoreLoadOpts,
  ): Promise<LoadResult[]> {
    return Promise.reject(new Error("Shopify is not implemented yet"));
  }

  async markConnected(supabase: SupabaseClient<Database>, organizationId: string): Promise<void> {
    await markStoreConnected(supabase, organizationId, "shopify");
  }

  connect(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
  ): Promise<{ results: LoadResult[]; success: boolean }> {
    return connectorConnect(this, supabase, organizationId, source);
  }
}

export const shopifyStore = new ShopifyStore();
