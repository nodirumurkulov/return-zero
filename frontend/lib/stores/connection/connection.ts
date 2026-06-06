import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { ConnectionError } from "./errors";
import type {
  ConnectResult,
  ConnectionConnectOpts,
  ConnectionSnapshotOpts,
  StoreConnectionPhase,
  StoreConnectionSnapshot,
  StoreConnectionStatus,
  StorePlatform,
} from "./types";

function derivePhase(status: StoreConnectionStatus, catalogReady: boolean): StoreConnectionPhase {
  if (status === "pending" || status === "disconnected" || status === "error") {
    return "idle";
  }
  if (status === "connected") {
    return "ready";
  }
  if (status === "syncing") {
    return catalogReady ? "commerce" : "catalog";
  }
  return "idle";
}

export class StoreConnectionDomain {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async snapshot(opts: ConnectionSnapshotOpts): Promise<StoreConnectionSnapshot> {
    const [row, catalogReady] = await Promise.all([
      this.readConnectionRow(opts.scope),
      this.catalogReady(opts.scope),
    ]);

    if (!row) {
      return {
        platform: null,
        status: "pending",
        phase: "idle",
        catalogReady: false,
        connectedAt: null,
      };
    }

    const status = row.status;
    return {
      platform: row.platform,
      status,
      phase: derivePhase(status, catalogReady),
      catalogReady,
      connectedAt: row.connected_at,
    };
  }

  async connect(opts: ConnectionConnectOpts): Promise<ConnectResult> {
    const current = await this.snapshot({ scope: opts.scope });

    if (current.status === "syncing") {
      return { snapshot: current, outcome: "already_syncing" };
    }

    if (
      current.status === "connected" &&
      current.platform === opts.platform &&
      current.catalogReady
    ) {
      return { snapshot: current, outcome: "already_connected" };
    }

    await this.markSyncing(opts.scope, opts.platform);
    const snapshot = await this.snapshot({ scope: opts.scope });
    return { snapshot, outcome: "started" };
  }

  private async readConnectionRow(scope: StoreScope) {
    const { data, error } = await this.supabase
      .from("store_connections")
      .select("platform, status, connected_at")
      .eq("id", scope.storeId)
      .maybeSingle();
    if (error) throw new ConnectionError(`store_connections read failed: ${error.message}`);
    return data;
  }

  private async catalogReady(scope: StoreScope): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", scope.organizationId)
      .eq("store_id", scope.storeId);
    if (error) throw new ConnectionError(`products count failed: ${error.message}`);
    return (count ?? 0) > 0;
  }

  private async markSyncing(scope: StoreScope, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        platform,
        status: "syncing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scope.storeId);
    if (error) throw new ConnectionError(`store_connections update failed: ${error.message}`);
  }
}
