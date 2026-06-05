import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";
import type { LoadResult } from "./connect";
import { ShopifyStoreConnector } from "./connect/shopify";

import { StoreConnections, type Store } from "./store";

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
