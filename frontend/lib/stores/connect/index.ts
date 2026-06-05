import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";

import { mockStore } from "./mock";
import { shopifyStore } from "./shopify";
import type { StorePlatform } from "./store-connection";

export interface LoadResult {
  table: string;
  count: number;
  error?: string;
}

export interface StoreConnectorLoadOpts {
  replace?: boolean;
}

/** Loads store data into org-scoped contract tables and marks the connection ready. */
export interface StoreConnector {
  readonly platform: StorePlatform;
  load(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
    opts?: StoreConnectorLoadOpts,
  ): Promise<LoadResult[]>;
  markConnected(supabase: SupabaseClient<Database>, organizationId: string): Promise<void>;
}

export const storeConnectors: Record<StorePlatform, StoreConnector> = {
  mock_csv: mockStore,
  shopify: shopifyStore,
};

export type {
  StoreConnection,
  StoreConnectionInsert,
  StoreConnectionStatus,
  StoreConnectionUpdate,
  StorePlatform,
  StoreSyncMode,
} from "./store-connection";
export { mockStore, type PrettyFlyFile, type PrettyFlyFiles } from "./mock";
export { shopifyStore } from "./shopify";
