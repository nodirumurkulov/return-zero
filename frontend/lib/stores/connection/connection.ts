import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { upsertStoreSecret } from "@/lib/shopify/server";
import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { ConnectionError } from "./errors";
import type {
  ConnectResult,
  ConnectShopifyOpts,
  ConnectShopifyResult,
  ConnectionConnectOpts,
  ConnectionListOpts,
  ConnectionSnapshotOpts,
  StoreConnectionListItem,
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

  async list(opts: ConnectionListOpts): Promise<StoreConnectionListItem[]> {
    const { data, error } = await this.supabase
      .from("store_connections")
      .select("id, label, platform, status, external_shop_id, connected_at")
      .eq("organization_id", opts.organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new ConnectionError(`store_connections list failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      platform: row.platform,
      status: row.status,
      externalShopId: row.external_shop_id,
      connectedAt: row.connected_at,
    }));
  }

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

  async connectShopify(opts: ConnectShopifyOpts): Promise<ConnectShopifyResult> {
    const existing = await this.findShopifyConnection(opts.organizationId, opts.externalShopId);
    const now = new Date().toISOString();

    const storeId = existing
      ? await this.refreshShopifyConnection(existing.id, opts.label, now)
      : await this.insertShopifyConnection(opts, now);

    await upsertStoreSecret(storeId, opts.accessToken, opts.scopes);
    await this.ensureActiveStore(opts.organizationId, storeId, opts.activateStore ?? false);

    return {
      storeId,
      organizationId: opts.organizationId,
      created: !existing,
    };
  }

  private async findShopifyConnection(organizationId: string, externalShopId: string) {
    const { data, error } = await this.supabase
      .from("store_connections")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("platform", "shopify")
      .eq("external_shop_id", externalShopId)
      .maybeSingle();

    if (error) {
      throw new ConnectionError(`store_connections lookup failed: ${error.message}`);
    }

    return data;
  }

  private async refreshShopifyConnection(storeId: string, label: string, updatedAt: string) {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        label,
        status: "syncing",
        updated_at: updatedAt,
      })
      .eq("id", storeId);

    if (error) {
      throw new ConnectionError(`store_connections update failed: ${error.message}`);
    }

    return storeId;
  }

  private async insertShopifyConnection(opts: ConnectShopifyOpts, updatedAt: string) {
    const { data, error } = await this.supabase
      .from("store_connections")
      .insert({
        organization_id: opts.organizationId,
        platform: "shopify",
        sync_mode: "pull",
        status: "syncing",
        external_shop_id: opts.externalShopId,
        label: opts.label,
        updated_at: updatedAt,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new ConnectionError(error?.message ?? "store_connections insert failed");
    }

    return data.id;
  }

  private async ensureActiveStore(
    organizationId: string,
    storeId: string,
    activateStore: boolean,
  ): Promise<void> {
    const { data: org, error: orgError } = await this.supabase
      .from("organizations")
      .select("active_store_id")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      throw new ConnectionError(`organizations read failed: ${orgError.message}`);
    }

    if (!activateStore && org.active_store_id) {
      return;
    }

    const { error: updateError } = await this.supabase
      .from("organizations")
      .update({
        active_store_id: storeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId);

    if (updateError) {
      throw new ConnectionError(`organizations update failed: ${updateError.message}`);
    }
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
