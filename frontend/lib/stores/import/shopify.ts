import type { SupabaseClient } from "@supabase/supabase-js";

import { createShopifyAdminClient, readStoreSecret } from "@/lib/shopify/server";
import type { Database } from "@/lib/supabase/db";
import type { StoreScope } from "@/lib/tenancy/types";

import { resetStoreData } from "../connection/reset-store-data";
import { ImportError } from "./errors";
import { type IdMapCache } from "./mock/id-maps";
import { loadShopifyCatalogPhase } from "./shopify/catalog-phase";
import { loadShopifyCommercePhase } from "./shopify/commerce-phase";
import type { ImportLoadOpts, ImportLoader, ImportTableResult } from "./types";

async function resolveShopifyClient(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
) {
  const { data: connection, error } = await supabase
    .from("store_connections")
    .select("external_shop_id")
    .eq("id", scope.storeId)
    .maybeSingle();

  if (error) {
    throw new ImportError(`store_connections read failed: ${error.message}`);
  }

  if (!connection?.external_shop_id) {
    throw new ImportError("Shopify store domain is missing on connection");
  }

  const secret = await readStoreSecret(scope.storeId);
  if (!secret) {
    throw new ImportError("Shopify access token is missing");
  }

  return createShopifyAdminClient({
    shop: connection.external_shop_id,
    accessToken: secret.accessToken,
  });
}

export class ShopifyImportLoader implements ImportLoader {
  readonly platform = "shopify" as const;

  async load(
    supabase: SupabaseClient<Database>,
    scope: StoreScope,
    _source: unknown,
    opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]> {
    const phased = await this.loadPhased(supabase, scope, opts);
    return [...phased.catalogResults, ...phased.commerceResults];
  }

  async loadPhased(
    supabase: SupabaseClient<Database>,
    scope: StoreScope,
    opts?: ImportLoadOpts,
  ): Promise<{
    catalogResults: ImportTableResult[];
    commerceResults: ImportTableResult[];
    maps: IdMapCache;
  }> {
    if (opts?.replace) {
      await resetStoreData(supabase, scope);
    }

    const client = await resolveShopifyClient(supabase, scope);
    const { results: catalogResults, maps } = await this.loadCatalogPhase(
      supabase,
      scope,
      client,
    );
    const commerceResults = await this.loadCommercePhase(supabase, scope, client, maps);
    return { catalogResults, commerceResults, maps };
  }

  async loadCatalogPhase(
    supabase: SupabaseClient<Database>,
    scope: StoreScope,
    client: Awaited<ReturnType<typeof resolveShopifyClient>>,
    existingMaps?: IdMapCache,
  ): Promise<{ results: ImportTableResult[]; maps: IdMapCache }> {
    return loadShopifyCatalogPhase(supabase, scope, client, existingMaps);
  }

  async loadCommercePhase(
    supabase: SupabaseClient<Database>,
    scope: StoreScope,
    client: Awaited<ReturnType<typeof resolveShopifyClient>>,
    maps: IdMapCache,
  ): Promise<ImportTableResult[]> {
    return loadShopifyCommercePhase(supabase, scope, client, maps);
  }
}
