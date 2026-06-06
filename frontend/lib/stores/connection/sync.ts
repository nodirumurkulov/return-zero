import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { MockImportLoader } from "../import/mock";
import { readHugoMockStorePack, type MockStoreFiles } from "../import/mock/pack";
import { ShopifyImportLoader } from "../import/shopify";
import { ConnectionError } from "./errors";
import { resetStoreData } from "./reset-store-data";
import type { StorePlatform } from "./types";

export type RunStoreSyncOpts = {
  scope: StoreScope;
  platform: StorePlatform;
  source?: unknown;
  replace?: boolean;
};

async function markStoreConnected(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
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
    .eq("id", scope.storeId);
  if (error) throw new ConnectionError(`store_connections update failed: ${error.message}`);
}

async function markStoreError(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
): Promise<void> {
  const { error } = await supabase
    .from("store_connections")
    .update({
      status: "error",
      updated_at: new Date().toISOString(),
    })
    .eq("id", scope.storeId);
  if (error) throw new ConnectionError(`store_connections update failed: ${error.message}`);
}

async function runMockCsvSync(
  supabase: SupabaseClient<Database>,
  opts: RunStoreSyncOpts,
): Promise<boolean> {
  const loader = new MockImportLoader();
  const source = (opts.source as MockStoreFiles | undefined) ?? readHugoMockStorePack();
  const replace = opts.replace ?? false;

  if (replace) {
    await resetStoreData(supabase, opts.scope);
  }

  const { results: catalogResults, maps } = await loader.loadCatalogPhase(
    supabase,
    opts.scope,
    source,
  );
  if (!catalogResults.every((result) => !result.error)) {
    await markStoreError(supabase, opts.scope);
    return false;
  }

  const commerceResults = await loader.loadCommercePhase(
    supabase,
    opts.scope,
    source,
    maps,
  );
  const results = [...catalogResults, ...commerceResults];
  const success = results.every((result) => !result.error);
  if (!success) {
    await markStoreError(supabase, opts.scope);
    return false;
  }

  await markStoreConnected(supabase, opts.scope, "mock_csv");
  return true;
}

async function runShopifySync(
  supabase: SupabaseClient<Database>,
  opts: RunStoreSyncOpts,
): Promise<boolean> {
  const loader = new ShopifyImportLoader();
  const results = await loader.load(supabase, opts.scope, opts.source, {
    replace: opts.replace ?? true,
  });
  const success = results.every((result) => !result.error);
  if (!success) {
    await markStoreError(supabase, opts.scope);
    return false;
  }
  await markStoreConnected(supabase, opts.scope, "shopify");
  return true;
}

export async function runStoreSync(
  supabase: SupabaseClient<Database>,
  opts: RunStoreSyncOpts,
): Promise<void> {
  try {
    const success =
      opts.platform === "mock_csv"
        ? await runMockCsvSync(supabase, opts)
        : await runShopifySync(supabase, opts);
    if (!success) {
      return;
    }
  } catch (err) {
    await markStoreError(supabase, opts.scope);
    throw err;
  }
}
