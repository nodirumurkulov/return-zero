import type { SupabaseClient } from "@supabase/supabase-js";

import type { ShopifyAdminClient } from "@/lib/shopify/client";
import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { csvLoader } from "../loaders/csv";
import type { IdMapCache } from "../mock/id-maps";
import type { ImportTableResult } from "../types";
import { fetchShopifyRestPages } from "./paginate";
import {
  mapShopifyCustomerRows,
  mapShopifyLineItemRows,
  mapShopifyOrderRows,
  mapShopifyRefundRows,
} from "./rows";
import { shopifyCustomerSchema, shopifyOrderSchema } from "./schemas";

export async function loadShopifyCommercePhase(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
  client: ShopifyAdminClient,
  maps: IdMapCache,
): Promise<ImportTableResult[]> {
  const results: ImportTableResult[] = [];

  const customers = await fetchShopifyRestPages({
    client,
    path: "/customers.json?limit=250",
    rootKey: "customers",
    parseItem: (item) => shopifyCustomerSchema.parse(item),
  });

  const customerResult = await csvLoader.upsert(
    supabase,
    "customers",
    mapShopifyCustomerRows(customers, scope),
    "organization_id,external_id",
  );
  maps.customers = await csvLoader.fetchExternalIdMap(supabase, "customers", scope);
  results.push(customerResult);

  const orders = await fetchShopifyRestPages({
    client,
    path: "/orders.json?status=any&limit=250",
    rootKey: "orders",
    parseItem: (item) => shopifyOrderSchema.parse(item),
  });

  const orderResult = await csvLoader.upsert(
    supabase,
    "orders",
    mapShopifyOrderRows(orders, scope, maps),
    "organization_id,external_id",
  );
  maps.orders = await csvLoader.fetchExternalIdMap(supabase, "orders", scope);
  results.push(orderResult);

  const lineItemResult = await csvLoader.upsert(
    supabase,
    "line_items",
    mapShopifyLineItemRows(orders, scope, maps),
    "organization_id,external_id",
  );
  results.push(lineItemResult);

  const refundResult = await csvLoader.upsert(
    supabase,
    "refunds",
    mapShopifyRefundRows(orders, scope, maps),
    "organization_id,external_id",
  );
  results.push(refundResult);

  return results;
}
