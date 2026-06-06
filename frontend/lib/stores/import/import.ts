import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { resetStoreData } from "../connection/reset-store-data";
import { ImportError } from "./errors";
import { MockImportLoader } from "./mock";
import { readHugoMockStorePack, type MockStoreFiles } from "./mock/pack";
import { ShopifyImportLoader } from "./shopify";
import type {
  ImportExternalIdMapOpts,
  ImportRunOpts,
  ImportRunResult,
  ImportStartResult,
  ImportStatusOpts,
  StoreConnection,
  StorePlatform,
} from "./types";

export class Import {
  private readonly mockLoader = new MockImportLoader();
  private readonly shopifyLoader = new ShopifyImportLoader();

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async status(opts: ImportStatusOpts): Promise<StoreConnection | null> {
    const { data, error } = await this.supabase
      .from("store_connections")
      .select("*")
      .eq("id", opts.scope.storeId)
      .maybeSingle();
    if (error) throw new ImportError(`store_connections read failed: ${error.message}`);
    return data;
  }

  async productCount(scope: StoreScope): Promise<number> {
    const { count, error } = await this.supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", scope.organizationId)
      .eq("store_id", scope.storeId);
    if (error) throw new ImportError(`products count failed: ${error.message}`);
    return count ?? 0;
  }

  async tryStartImport(opts: ImportRunOpts): Promise<ImportStartResult> {
    const connection = await this.status({ scope: opts.scope });

    if (connection?.status === "syncing") {
      return { action: "already_syncing" };
    }

    if (connection?.status === "connected" && connection.platform === opts.platform) {
      const count = await this.productCount(opts.scope);
      if (count > 0) {
        return { action: "skipped" };
      }
    }

    await this.markStoreSyncing(opts.scope, opts.platform);
    return { action: "started" };
  }

  async runBackgroundImport(opts: ImportRunOpts): Promise<ImportRunResult> {
    try {
      if (opts.platform === "mock_csv") {
        return await this.runMockBackgroundImport(opts);
      }

      const results = await this.shopifyLoader.load(this.supabase, opts.scope, opts.source, {
        replace: opts.replace ?? true,
      });
      await this.markStoreConnected(opts.scope, opts.platform);
      return { results, success: results.every((result) => !result.error) };
    } catch (err) {
      await this.markStoreError(opts.scope);
      throw err;
    }
  }

  /** Synchronous import for scripts and explicit full reloads. */
  async run(opts: ImportRunOpts): Promise<ImportRunResult> {
    if (opts.platform === "mock_csv") {
      const source = (opts.source as MockStoreFiles | undefined) ?? readHugoMockStorePack();
      const results = await this.mockLoader.load(this.supabase, opts.scope, source, {
        replace: opts.replace ?? false,
      });
      await this.markStoreConnected(opts.scope, "mock_csv");
      return { results, success: results.every((result) => !result.error) };
    }

    const results = await this.shopifyLoader.load(this.supabase, opts.scope, opts.source, {
      replace: opts.replace ?? true,
    });
    await this.markStoreConnected(opts.scope, opts.platform);
    return { results, success: results.every((result) => !result.error) };
  }

  externalIdMap(opts: ImportExternalIdMapOpts): Promise<Map<string, string>> {
    return this.mockLoader.fetchExternalIdMap(this.supabase, opts.table, opts.scope);
  }

  private async runMockBackgroundImport(opts: ImportRunOpts): Promise<ImportRunResult> {
    const source = (opts.source as MockStoreFiles | undefined) ?? readHugoMockStorePack();
    const replace = opts.replace ?? false;

    if (replace) {
      try {
        await resetStoreData(this.supabase, opts.scope);
      } catch (err) {
        const message = err instanceof Error ? err.message : "reset_store_data failed";
        throw new ImportError(message);
      }
    }

    const { results: catalogResults, maps } = await this.mockLoader.loadCatalogPhase(
      this.supabase,
      opts.scope,
      source,
    );
    const catalogSuccess = catalogResults.every((result) => !result.error);
    if (!catalogSuccess) {
      await this.markStoreError(opts.scope);
      return { results: catalogResults, success: false };
    }

    await this.markStoreConnected(opts.scope, "mock_csv");

    const commerceResults = await this.mockLoader.loadCommercePhase(
      this.supabase,
      opts.scope,
      source,
      maps,
    );

    const results = [...catalogResults, ...commerceResults];
    const success = results.every((result) => !result.error);
    return { results, success };
  }

  private async markStoreSyncing(scope: StoreScope, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        platform,
        status: "syncing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scope.storeId);
    if (error) throw new ImportError(`store_connections update failed: ${error.message}`);
  }

  private async markStoreConnected(scope: StoreScope, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        platform,
        status: "connected",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", scope.storeId);
    if (error) throw new ImportError(`store_connections update failed: ${error.message}`);
  }

  private async markStoreError(scope: StoreScope): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scope.storeId);
    if (error) throw new ImportError(`store_connections update failed: ${error.message}`);
  }
}
