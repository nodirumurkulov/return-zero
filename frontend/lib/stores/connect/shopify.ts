import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";

import type { LoadResult, StoreConnector, StoreLoadOpts } from ".";

export class ShopifyStoreConnector implements StoreConnector {
  readonly platform = "shopify" as const;

  load(
    _supabase: SupabaseClient<Database>,
    _organizationId: string,
    _source: unknown,
    _opts?: StoreLoadOpts,
  ): Promise<LoadResult[]> {
    return Promise.reject(new Error("Shopify is not available yet"));
  }
}
