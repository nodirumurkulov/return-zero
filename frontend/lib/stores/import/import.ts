import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { resetActiveStoreData, resolveActiveStoreId } from "../connection/reset-store-data";
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
      .eq("organization_id", opts.organizationId)
      .maybeSingle();
    if (error) throw new ImportError(`store_connections read failed: ${error.message}`);
    return data;
  }

  async productCount(organizationId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    if (error) throw new ImportError(`products count failed: ${error.message}`);
    return count ?? 0;
  }

  async tryStartImport(opts: ImportRunOpts): Promise<ImportStartResult> {
    const connection = await this.status({ organizationId: opts.organizationId });

    if (connection?.status === "importing") {
      return { action: "already_importing" };
    }

    if (connection?.status === "connected" && connection.platform === opts.platform) {
      const count = await this.productCount(opts.organizationId);
      if (count > 0) {
        return { action: "skipped" };
      }
    }

    await this.markStoreImporting(opts.organizationId, opts.platform);
    return { action: "started" };
  }

  async runBackgroundImport(opts: ImportRunOpts): Promise<ImportRunResult> {
    try {
      if (opts.platform === "mock_csv") {
        return await this.runMockBackgroundImport(opts);
      }

      const results = await this.shopifyLoader.load(this.supabase, opts.organizationId, opts.source, {
        replace: opts.replace ?? true,
      });
      await this.markStoreConnected(opts.organizationId, opts.platform);
      return { results, success: results.every((result) => !result.error) };
    } catch (err) {
      await this.markStoreError(opts.organizationId);
      throw err;
    }
  }

  /** Synchronous import for scripts and explicit full reloads. */
  async run(opts: ImportRunOpts): Promise<ImportRunResult> {
    if (opts.platform === "mock_csv") {
      const source = (opts.source as MockStoreFiles | undefined) ?? readHugoMockStorePack();
      const results = await this.mockLoader.load(this.supabase, opts.organizationId, source, {
        replace: opts.replace ?? false,
      });
      await this.markStoreConnected(opts.organizationId, "mock_csv");
      return { results, success: results.every((result) => !result.error) };
    }

    const results = await this.shopifyLoader.load(this.supabase, opts.organizationId, opts.source, {
      replace: opts.replace ?? true,
    });
    await this.markStoreConnected(opts.organizationId, opts.platform);
    return { results, success: results.every((result) => !result.error) };
  }

  externalIdMap(opts: ImportExternalIdMapOpts): Promise<Map<string, string>> {
    return this.mockLoader.fetchExternalIdMap(this.supabase, opts.table, opts.organizationId);
  }

  private async runMockBackgroundImport(opts: ImportRunOpts): Promise<ImportRunResult> {
    const source = (opts.source as MockStoreFiles | undefined) ?? readHugoMockStorePack();
    const replace = opts.replace ?? false;

    const storeId = await resolveActiveStoreId(this.supabase, opts.organizationId);

    if (replace) {
      try {
        await resetActiveStoreData(this.supabase, opts.organizationId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "reset_store_data failed";
        throw new ImportError(message);
      }
    }

    const { results: catalogResults, maps } = await this.mockLoader.loadCatalogPhase(
      this.supabase,
      opts.organizationId,
      storeId,
      source,
    );
    const catalogSuccess = catalogResults.every((result) => !result.error);
    if (!catalogSuccess) {
      await this.markStoreError(opts.organizationId);
      return { results: catalogResults, success: false };
    }

    await this.markStoreConnected(opts.organizationId, "mock_csv");

    const commerceResults = await this.mockLoader.loadCommercePhase(
      this.supabase,
      opts.organizationId,
      storeId,
      source,
      maps,
    );

    const results = [...catalogResults, ...commerceResults];
    const success = results.every((result) => !result.error);
    return { results, success };
  }

  private async markStoreImporting(organizationId: string, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        platform,
        status: "importing",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (error) throw new ImportError(`store_connections update failed: ${error.message}`);
  }

  private async markStoreConnected(organizationId: string, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        platform,
        status: "connected",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (error) throw new ImportError(`store_connections update failed: ${error.message}`);
  }

  private async markStoreError(organizationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (error) throw new ImportError(`store_connections update failed: ${error.message}`);
  }
}
