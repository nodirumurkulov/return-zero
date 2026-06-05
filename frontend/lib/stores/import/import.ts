import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { ExternalIdTable } from "./loaders/csv";
import type { PrettyFlyFiles } from "./mock/pack";
import { fetchProductExternalIdMap, markStoreImported, provisionMockCsvStore } from "./provision";
import { ShopifyImportLoader } from "./shopify";
import type { ImportRunResult, StoreConnection, StorePlatform } from "./index";

export interface ImportRunOpts {
  organizationId: string;
  platform: StorePlatform;
  source?: unknown;
  replace?: boolean;
}

export interface ImportStatusOpts {
  organizationId: string;
}

export interface ImportExternalIdMapOpts {
  organizationId: string;
  table: ExternalIdTable;
}

export class Import {
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
    if (opts.platform === "mock_csv") {
      return provisionMockCsvStore(this.supabase, {
        organizationId: opts.organizationId,
        source: opts.source as PrettyFlyFiles | undefined,
        replace: opts.replace,
      });
    }

    const results = await this.shopifyLoader.load(this.supabase, opts.organizationId, opts.source, {
      replace: opts.replace ?? true,
    });
    await markStoreImported(this.supabase, opts.organizationId, opts.platform);
    return { results, success: results.every((result) => !result.error) };
  }

  externalIdMap(opts: ImportExternalIdMapOpts): Promise<Map<string, string>> {
    return fetchProductExternalIdMap(this.supabase, opts.organizationId, opts.table);
  }
}
