import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { ExternalIdTable } from "./loaders/csv";
import { MockImportLoader } from "./mock";
import { prettyFlyPack } from "./mock/pack";
import { ShopifyImportLoader } from "./shopify";
import type { ImportTableResult, StoreConnection, StorePlatform } from "./index";

export interface ImportRunOpts {
  organizationId: string;
  platform: StorePlatform;
  source?: unknown;
  replace?: boolean;
}

export interface ImportRunResult {
  results: ImportTableResult[];
  success: boolean;
}

export interface ImportStatusOpts {
  organizationId: string;
}

export interface ImportExternalIdMapOpts {
  organizationId: string;
  table: ExternalIdTable;
}

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
    if (error) throw new Error(`store_connections read failed: ${error.message}`);
    return data;
  }

  async run(opts: ImportRunOpts): Promise<ImportRunResult> {
    const loader = opts.platform === "mock_csv" ? this.mockLoader : this.shopifyLoader;
    const source =
      opts.source ?? (opts.platform === "mock_csv" ? prettyFlyPack.read() : undefined);
    const results = await loader.load(this.supabase, opts.organizationId, source, {
      replace: opts.replace ?? true,
    });
    await this.markImported(opts.organizationId, opts.platform);
    return { results, success: results.every((result) => !result.error) };
  }

  externalIdMap(opts: ImportExternalIdMapOpts): Promise<Map<string, string>> {
    return this.mockLoader.fetchExternalIdMap(this.supabase, opts.table, opts.organizationId);
  }

  private async markImported(organizationId: string, platform: StorePlatform): Promise<void> {
    const { error } = await this.supabase
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
