import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

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
  if (status === "importing") {
    return catalogReady ? "commerce" : "catalog";
  }
  return "idle";
}

export class StoreConnectionDomain {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async snapshot(opts: ConnectionSnapshotOpts): Promise<StoreConnectionSnapshot> {
    const [row, catalogReady] = await Promise.all([
      this.readConnectionRow(opts.organizationId),
      this.catalogReady(opts.organizationId),
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
    const current = await this.snapshot({ organizationId: opts.organizationId });

    if (current.status === "importing") {
      return { snapshot: current, outcome: "already_syncing" };
    }

    if (
      current.status === "connected" &&
      current.platform === opts.platform &&
      current.catalogReady
    ) {
      return { snapshot: current, outcome: "already_connected" };
    }

    await this.markImporting(opts.organizationId, opts.platform);
    const snapshot = await this.snapshot({ organizationId: opts.organizationId });
    return { snapshot, outcome: "started" };
  }

  private async readConnectionRow(organizationId: string) {
    const { data, error } = await this.supabase
      .from("store_connections")
      .select("platform, status, connected_at")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) throw new ConnectionError(`store_connections read failed: ${error.message}`);
    return data;
  }

  private async catalogReady(organizationId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    if (error) throw new ConnectionError(`products count failed: ${error.message}`);
    return (count ?? 0) > 0;
  }

  private async markImporting(organizationId: string, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        platform,
        status: "importing",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (error) throw new ConnectionError(`store_connections update failed: ${error.message}`);
  }
}
