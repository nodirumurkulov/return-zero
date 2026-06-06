import { describe, expect, it } from "vitest";

import type { StoreScope } from "@/lib/tenancy/types";

import sample from "./fixtures/sample-api.json";
import {
  mapShopifyCollectionRows,
  mapShopifyCustomerRows,
  mapShopifyLineItemRows,
  mapShopifyOrderRows,
  mapShopifyProductCollectionRows,
  mapShopifyProductRows,
  mapShopifyVariantRows,
} from "./rows";
import {
  shopifyCollectionSchema,
  shopifyCollectSchema,
  shopifyCustomerSchema,
  shopifyOrderSchema,
  shopifyProductSchema,
} from "./schemas";

const scope: StoreScope = {
  organizationId: "org-1",
  storeId: "store-1",
};

describe("Shopify import mappers", () => {
  it("maps catalog entities from fixture payloads", () => {
    const collections = sample.collections.map((row) => shopifyCollectionSchema.parse(row));
    const products = sample.products.map((row) => shopifyProductSchema.parse(row));
    const collects = sample.collects.map((row) => shopifyCollectSchema.parse(row));

    const collectionRows = mapShopifyCollectionRows(collections, scope);
    const productRows = mapShopifyProductRows(products, scope);
    const maps = {
      collections: new Map([["841564295", "col-uuid"]]),
      collectionsByTitle: new Map(),
      products: new Map([["632910392", "prod-uuid"]]),
      customers: new Map(),
      variants: new Map(),
      orders: new Map(),
      purchase_orders: new Map(),
      suppliers: new Map(),
      email_campaigns: new Map(),
      support_tickets: new Map(),
    };

    const variantRows = mapShopifyVariantRows(products, scope, maps);
    const productCollectionRows = mapShopifyProductCollectionRows(collects, scope, maps);

    expect(collectionRows[0]?.external_id).toBe("841564295");
    expect(productRows[0]?.handle).toBe("ipod-nano");
    expect(variantRows[0]?.sku).toBe("IPOD2008PINK");
    expect(productCollectionRows).toHaveLength(1);
  });

  it("maps commerce entities with id map lookups", () => {
    const customers = sample.customers.map((row) => shopifyCustomerSchema.parse(row));
    const orders = sample.orders.map((row) => shopifyOrderSchema.parse(row));

    const maps = {
      collections: new Map(),
      collectionsByTitle: new Map(),
      products: new Map([["632910392", "prod-uuid"]]),
      customers: new Map([["207119551", "cust-uuid"]]),
      variants: new Map([["808950810", "var-uuid"]]),
      orders: new Map([["450789469", "order-uuid"]]),
      purchase_orders: new Map(),
      suppliers: new Map(),
      email_campaigns: new Map(),
      support_tickets: new Map(),
    };

    const customerRows = mapShopifyCustomerRows(customers, scope);
    const orderRows = mapShopifyOrderRows(orders, scope, maps);
    const lineItemRows = mapShopifyLineItemRows(orders, scope, maps);

    expect(customerRows[0]?.email).toBe("bob@example.com");
    expect(orderRows[0]?.customer_id).toBe("cust-uuid");
    expect(lineItemRows[0]?.variant_id).toBe("var-uuid");
  });
});
