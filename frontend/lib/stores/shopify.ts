import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";
import type { LoadResult } from "./connect";
import { ShopifyStoreConnector } from "./connect/shopify";

import { StoreConnections, type Store } from "./store";

export class ShopifyStore implements Store {
  readonly platform = "shopify" as const;
  readonly connector = new ShopifyStoreConnector();
  readonly connections = new StoreConnections();

  async connect(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source?: unknown,
  ): Promise<{ results: LoadResult[]; success: boolean }> {
    const results = await this.connector.load(supabase, organizationId, source, { replace: true });
    await this.connections.markConnected(supabase, organizationId, this.platform);
    return { results, success: results.every((r) => !r.error) };
  }

  getConnection(supabase: SupabaseClient<Database>, organizationId: string) {
    return this.connections.get(supabase, organizationId);
  }
}
