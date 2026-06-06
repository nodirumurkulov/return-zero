import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { MockImportLoader } from "../import/mock";
import { readHugoMockStorePack, type MockStoreFiles } from "../import/mock/pack";
import { ShopifyImportLoader } from "../import/shopify";
import { ConnectionError } from "./errors";
import { resetActiveStoreData, resolveActiveStoreId } from "./reset-store-data";
import type { StorePlatform } from "./types";

export type RunStoreSyncOpts = {
  organizationId: string;
  platform: StorePlatform;
  source?: unknown;
  replace?: boolean;
};

export { resetActiveStoreData } from "./reset-store-data";

async function markStoreConnected(
  supabase: SupabaseClient<Database>,
  organizationId: string,
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
    .eq("organization_id", organizationId);
  if (error) throw new ConnectionError(`store_connections update failed: ${error.message}`);
}

async function markStoreError(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("store_connections")
    .update({
      status: "error",
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);
  if (error) throw new ConnectionError(`store_connections update failed: ${error.message}`);
}

async function runMockCsvSync(
  supabase: SupabaseClient<Database>,
  opts: RunStoreSyncOpts,
): Promise<boolean> {
  const loader = new MockImportLoader();
  const source = (opts.source as MockStoreFiles | undefined) ?? readHugoMockStorePack();
  const replace = opts.replace ?? false;

  const storeId = await resolveActiveStoreId(supabase, opts.organizationId);

  if (replace) {
    await resetActiveStoreData(supabase, opts.organizationId);
  }

  const { results: catalogResults, maps } = await loader.loadCatalogPhase(
    supabase,
    opts.organizationId,
    storeId,
    source,
  );
  if (!catalogResults.every((result) => !result.error)) {
    await markStoreError(supabase, opts.organizationId);
    return false;
  }

  const commerceResults = await loader.loadCommercePhase(
    supabase,
    opts.organizationId,
    storeId,
    source,
    maps,
  );
  const results = [...catalogResults, ...commerceResults];
  const success = results.every((result) => !result.error);
  if (!success) {
    await markStoreError(supabase, opts.organizationId);
    return false;
  }

  await markStoreConnected(supabase, opts.organizationId, "mock_csv");
  return true;
}

async function runShopifySync(
  supabase: SupabaseClient<Database>,
  opts: RunStoreSyncOpts,
): Promise<boolean> {
  const loader = new ShopifyImportLoader();
  const results = await loader.load(supabase, opts.organizationId, opts.source, {
    replace: opts.replace ?? true,
  });
  const success = results.every((result) => !result.error);
  if (!success) {
    await markStoreError(supabase, opts.organizationId);
    return false;
  }
  await markStoreConnected(supabase, opts.organizationId, "shopify");
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
    await markStoreError(supabase, opts.organizationId);
    throw err;
  }
}
