import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { ImportError } from "./errors";
import { MockImportLoader } from "./mock";
import { hugoMockStorePack, type MockStoreFiles } from "./mock/pack";
import { ShopifyImportLoader } from "./shopify";
import type {
  ImportExternalIdMapOpts,
  ImportRunOpts,
  ImportRunResult,
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

  async run(opts: ImportRunOpts): Promise<ImportRunResult> {
    if (opts.platform === "mock_csv") {
      const source = (opts.source as MockStoreFiles | undefined) ?? hugoMockStorePack.read();
      const results = await this.mockLoader.load(this.supabase, opts.organizationId, source, {
        replace: opts.replace ?? true,
      });
      await this.markStoreImported(opts.organizationId, "mock_csv");
      return { results, success: results.every((result) => !result.error) };
    }

    const results = await this.shopifyLoader.load(this.supabase, opts.organizationId, opts.source, {
      replace: opts.replace ?? true,
    });
    await this.markStoreImported(opts.organizationId, opts.platform);
    return { results, success: results.every((result) => !result.error) };
  }

  externalIdMap(opts: ImportExternalIdMapOpts): Promise<Map<string, string>> {
    return this.mockLoader.fetchExternalIdMap(this.supabase, opts.table, opts.organizationId);
  }

  private async markStoreImported(organizationId: string, platform: StorePlatform): Promise<void> {
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
}
