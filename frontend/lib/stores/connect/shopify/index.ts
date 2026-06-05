import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";


import { markStoreConnected } from "../setup";
import type { LoadResult, StoreConnector, StoreLoadOpts } from "../store-connector";

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
}

export const shopifyStore = new ShopifyStore();
