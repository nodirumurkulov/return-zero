import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";

import {
  StoreConnections,
  type LoadResult,
  type Store,
  type StoreConnector,
  type StoreLoadOpts,
} from ".";

export class ShopifyStoreConnector implements StoreConnector {
  readonly platform = "shopify" as const;

  load(
    _supabase: SupabaseClient<Database>,
    _organizationId: string,
    _source: unknown,
    _opts?: StoreLoadOpts,
  ): Promise<LoadResult[]> {
    return Promise.reject(new Error("Shopify is not implemented yet"));
  }
}

export class ShopifyStore implements Store {
  readonly platform = "shopify" as const;
  readonly connector = new ShopifyStoreConnector();
  readonly connections = new StoreConnections();

  connect(): Promise<{ results: LoadResult[]; success: boolean }> {
    return Promise.reject(new Error("Shopify is not available yet"));
  }

  getConnection(supabase: SupabaseClient<Database>, organizationId: string) {
    return this.connections.get(supabase, organizationId);
  }
}
