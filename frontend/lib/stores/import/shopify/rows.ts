import type { TablesInsert } from "@/lib/supabase/db";
import type { StoreScope } from "@/lib/tenancy/types";

import type { IdMaps } from "../mock/rows";
import type {
  ShopifyCollection,
  ShopifyCollect,
  ShopifyCustomer,
  ShopifyLineItem,
  ShopifyOrder,
  ShopifyProduct,
  ShopifyRefund,
  ShopifyVariant,
} from "./schemas";

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function variantWeightGrams(variant: ShopifyVariant): number | null {
  if (variant.grams != null) {
    return variant.grams;
  }

  if (variant.weight == null) {
    return null;
  }

  const unit = variant.weight_unit?.toLowerCase() ?? "g";
  if (unit === "kg" || unit === "kilograms") {
    return Math.round(variant.weight * 1000);
  }

  if (unit === "lb" || unit === "pounds") {
    return Math.round(variant.weight * 453.592);
  }

  return Math.round(variant.weight);
}

export function mapShopifyCollectionRows(
  rows: ShopifyCollection[],
  scope: StoreScope,
): TablesInsert<"collections">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.id,
    title: row.title ?? null,
    created_at: row.published_at ?? undefined,
  }));
}

export function mapShopifyProductRows(
  products: ShopifyProduct[],
  scope: StoreScope,
): TablesInsert<"products">[] {
  return products.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.id,
    title: row.title ?? null,
    handle: row.handle ?? null,
    description: row.body_html ?? null,
    product_type: row.product_type ?? null,
    vendor: row.vendor ?? null,
    gender_segment: null,
    tags: row.tags ?? null,
    status: row.status ?? null,
    created_at: row.created_at ?? undefined,
    collection_id: null,
  }));
}

export function mapShopifyVariantRows(
  products: ShopifyProduct[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"variants">[] {
  return products.flatMap((product) => {
    const productId = maps.products.get(product.id);
    if (!productId) {
      return [];
    }

    const optionNames = product.options?.map((option) => option.name) ?? [];

    return (product.variants ?? []).flatMap((variant) =>
      mapShopifyVariantRow(variant, scope, productId, optionNames),
    );
  });
}

function mapShopifyVariantRow(
  variant: ShopifyVariant,
  scope: StoreScope,
  productId: string,
  optionNames: string[],
): TablesInsert<"variants">[] {
  return [
    {
      organization_id: scope.organizationId,
      store_id: scope.storeId,
      external_id: variant.id,
      product_id: productId,
      sku: variant.sku ?? null,
      option1_name: optionNames[0] ?? null,
      option1_value: variant.option1 ?? null,
      option2_name: optionNames[1] ?? null,
      option2_value: variant.option2 ?? null,
      price: toNumber(variant.price),
      compare_at_price: toNumber(variant.compare_at_price),
      barcode: variant.barcode ?? null,
      weight_grams: variantWeightGrams(variant),
      inventory_quantity: variant.inventory_quantity ?? null,
    },
  ];
}

export function mapShopifyProductCollectionRows(
  collects: ShopifyCollect[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"product_collections">[] {
  return collects.flatMap((row) => {
    const productId = maps.products.get(row.product_id);
    const collectionId = maps.collections.get(row.collection_id);
    if (!productId || !collectionId) {
      return [];
    }

    return [
      {
        organization_id: scope.organizationId,
        store_id: scope.storeId,
        product_id: productId,
        collection_id: collectionId,
      },
    ];
  });
}

export function mapShopifyCustomerRows(
  rows: ShopifyCustomer[],
  scope: StoreScope,
): TablesInsert<"customers">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.id,
    email: row.email ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    created_at: row.created_at ?? undefined,
    accepts_marketing: row.accepts_marketing ?? false,
    total_spent: toNumber(row.total_spent),
    orders_count: row.orders_count ?? null,
    acquisition_source: null,
    acquisition_date: null,
    default_country: row.default_address?.country ?? null,
    gender_segment_affinity: null,
  }));
}

export function mapShopifyOrderRows(
  rows: ShopifyOrder[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"orders">[] {
  return rows.flatMap((row) => {
    const customerExternalId = row.customer?.id;
    if (!customerExternalId) {
      return [];
    }

    const customerId = maps.customers.get(customerExternalId);
    if (!customerId) {
      return [];
    }

    const discountCode = row.discount_codes?.[0]?.code ?? null;

    return [
      {
        organization_id: scope.organizationId,
        store_id: scope.storeId,
        external_id: row.id,
        customer_id: customerId,
        order_number: row.order_number != null ? String(row.order_number) : (row.name ?? null),
        created_at: row.created_at ?? undefined,
        currency: row.currency ?? null,
        subtotal: toNumber(row.subtotal_price),
        total_discounts: toNumber(row.total_discounts),
        total_shipping: toNumber(row.total_shipping_price_set?.shop_money?.amount),
        total_tax: toNumber(row.total_tax),
        total_price: toNumber(row.total_price),
        financial_status: row.financial_status ?? null,
        fulfillment_status: row.fulfillment_status ?? null,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        landing_site: row.landing_site ?? null,
        referring_site: row.referring_site ?? null,
        tags: row.tags ?? null,
        discount_code: discountCode,
      },
    ];
  });
}

export function mapShopifyLineItemRows(
  orders: ShopifyOrder[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"line_items">[] {
  return orders.flatMap((order) =>
    (order.line_items ?? []).flatMap((lineItem) =>
      mapShopifyLineItemRow(order.id, lineItem, scope, maps),
    ),
  );
}

function mapShopifyLineItemRow(
  orderExternalId: string,
  lineItem: ShopifyLineItem,
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"line_items">[] {
  const orderId = maps.orders.get(orderExternalId);
  const variantExternalId = lineItem.variant_id ?? undefined;
  const productExternalId = lineItem.product_id ?? undefined;
  if (!orderId || !variantExternalId || !productExternalId) {
    return [];
  }

  const variantId = maps.variants.get(variantExternalId);
  const productId = maps.products.get(productExternalId);
  if (!variantId || !productId) {
    return [];
  }

  return [
    {
      organization_id: scope.organizationId,
      store_id: scope.storeId,
      external_id: lineItem.id,
      order_id: orderId,
      variant_id: variantId,
      product_id: productId,
      title: lineItem.title ?? null,
      quantity: lineItem.quantity ?? null,
      price: toNumber(lineItem.price),
      total_discount: toNumber(lineItem.total_discount),
    },
  ];
}

export function mapShopifyRefundRows(
  orders: ShopifyOrder[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"refunds">[] {
  return orders.flatMap((order) =>
    (order.refunds ?? []).flatMap((refund) => mapShopifyRefundRow(order.id, refund, scope, maps)),
  );
}

function mapShopifyRefundRow(
  orderExternalId: string,
  refund: ShopifyRefund,
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"refunds">[] {
  const orderId = maps.orders.get(orderExternalId);
  if (!orderId) {
    return [];
  }

  const refundLineItems = (refund.refund_line_items ?? []).map((item) => ({
    variant_external_id: item.line_item_id != null ? String(item.line_item_id) : null,
    quantity: item.quantity ?? null,
    subtotal: toNumber(item.subtotal),
  }));

  const transactionAmount = refund.transactions?.reduce(
    (sum, transaction) => sum + (toNumber(transaction.amount) ?? 0),
    0,
  );

  return [
    {
      organization_id: scope.organizationId,
      store_id: scope.storeId,
      external_id: refund.id,
      order_id: orderId,
      created_at: refund.created_at ?? undefined,
      amount: transactionAmount ?? 0,
      reason: refund.note ?? null,
      refund_line_items: refundLineItems,
    },
  ];
}
