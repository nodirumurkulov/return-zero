import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";
import type { LoadResult, StoreConnection, StoreConnector, StorePlatform } from "./connect";

export interface Store {
  readonly platform: StorePlatform;
  readonly connector: StoreConnector;
  readonly connections: StoreConnections;
  connect(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source?: unknown,
  ): Promise<{ results: LoadResult[]; success: boolean }>;
  getConnection(
    supabase: SupabaseClient<Database>,
    organizationId: string,
  ): Promise<StoreConnection | null>;
}

export class StoreConnections {
  async get(
    supabase: SupabaseClient<Database>,
    organizationId: string,
  ): Promise<StoreConnection | null> {
    const { data, error } = await supabase
      .from("store_connections")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) throw new Error(`store_connections read failed: ${error.message}`);
    return data;
  }

  async markConnected(
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
}
