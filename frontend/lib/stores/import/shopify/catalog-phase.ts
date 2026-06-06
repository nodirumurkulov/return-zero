import type { SupabaseClient } from "@supabase/supabase-js";

import type { ShopifyAdminClient } from "@/lib/shopify/client";
import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { csvLoader } from "../loaders/csv";
import { IdMapCache } from "../mock/id-maps";
import type { ImportTableResult } from "../types";
import { fetchShopifyRestPages } from "./paginate";
import {
  mapShopifyCollectionRows,
  mapShopifyProductCollectionRows,
  mapShopifyProductRows,
  mapShopifyVariantRows,
} from "./rows";
import {
  shopifyCollectionSchema,
  shopifyCollectSchema,
  shopifyProductSchema,
} from "./schemas";

export async function loadShopifyCatalogPhase(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
  client: ShopifyAdminClient,
  existingMaps?: IdMapCache,
): Promise<{ results: ImportTableResult[]; maps: IdMapCache }> {
  const maps = existingMaps ?? new IdMapCache();
  const results: ImportTableResult[] = [];

  const customCollections = await fetchShopifyRestPages({
    client,
    path: "/custom_collections.json?limit=250",
    rootKey: "custom_collections",
    parseItem: (item) => shopifyCollectionSchema.parse(item),
  });
  const smartCollections = await fetchShopifyRestPages({
    client,
    path: "/smart_collections.json?limit=250",
    rootKey: "smart_collections",
    parseItem: (item) => shopifyCollectionSchema.parse(item),
  });

  const collectionResult = await csvLoader.upsert(
    supabase,
    "collections",
    mapShopifyCollectionRows([...customCollections, ...smartCollections], scope),
    "organization_id,external_id",
  );
  await maps.refreshCollections(supabase, scope);
  results.push(collectionResult);

  const products = await fetchShopifyRestPages({
    client,
    path: "/products.json?limit=250",
    rootKey: "products",
    parseItem: (item) => shopifyProductSchema.parse(item),
  });

  const productResult = await csvLoader.upsert(
    supabase,
    "products",
    mapShopifyProductRows(products, scope),
    "organization_id,external_id",
  );
  maps.products = await csvLoader.fetchExternalIdMap(supabase, "products", scope);
  results.push(productResult);

  const variantResult = await csvLoader.upsert(
    supabase,
    "variants",
    mapShopifyVariantRows(products, scope, maps),
    "organization_id,external_id",
  );
  maps.variants = await csvLoader.fetchExternalIdMap(supabase, "variants", scope);
  results.push(variantResult);

  const collects = await fetchShopifyRestPages({
    client,
    path: "/collects.json?limit=250",
    rootKey: "collects",
    parseItem: (item) => shopifyCollectSchema.parse(item),
  });

  const productCollectionResult = await csvLoader.upsert(
    supabase,
    "product_collections",
    mapShopifyProductCollectionRows(collects, scope, maps),
    "organization_id,product_id,collection_id",
  );
  results.push(productCollectionResult);

  return { results, maps };
}
