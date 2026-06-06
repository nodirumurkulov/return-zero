import { z } from "zod";

import type { Json, TablesInsert } from "@/lib/supabase/db";
import type { StoreScope } from "@/lib/tenancy/types";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const csvString = z.union([z.string(), z.number()]).transform(String);

export const csvOptionalString = z.preprocess(
  emptyToNull,
  z.union([z.string(), z.number()]).transform(String).nullable(),
);

export const csvBoolean = z.preprocess(
  (value) => value === true || value === "true" || value === "True",
  z.boolean(),
);

export const csvJsonArray = z.preprocess((value) => {
  if (value === "" || value == null) return [];
  if (typeof value === "string") return JSON.parse(value) as unknown;
  return value;
}, z.array(z.unknown()));

export const mockStoreCollectionRowSchema = z.object({
  collection_id: csvString,
  title: csvOptionalString,
  created_at: csvOptionalString,
});

export const mockStoreSupplierRowSchema = z.object({
  supplier_id: csvString,
  name: csvOptionalString,
  country: csvOptionalString,
  payment_terms: csvOptionalString,
  lead_time_days: z.coerce.number().optional().nullable(),
  currency: csvOptionalString,
});

export const mockStoreProductRowSchema = z.object({
  product_id: csvString,
  title: csvOptionalString,
  handle: csvOptionalString,
  description: csvOptionalString,
  product_type: csvOptionalString,
  vendor: csvOptionalString,
  collection: csvOptionalString,
  gender_segment: csvOptionalString,
  tags: csvOptionalString,
  status: csvOptionalString,
  created_at: csvOptionalString,
});

export const mockStoreCustomerRowSchema = z.object({
  customer_id: csvString,
  email: csvOptionalString,
  first_name: csvOptionalString,
  last_name: csvOptionalString,
  created_at: csvOptionalString,
  accepts_marketing: csvBoolean,
  total_spent: z.coerce.number().optional().nullable(),
  orders_count: z.coerce.number().optional().nullable(),
  acquisition_source: csvOptionalString,
  acquisition_date: csvOptionalString,
  default_country: csvOptionalString,
  gender_segment_affinity: csvOptionalString,
});

export const mockStoreVariantRowSchema = z.object({
  variant_id: csvString,
  product_id: csvString,
  sku: csvOptionalString,
  option1_name: csvOptionalString,
  option1_value: csvOptionalString,
  option2_name: csvOptionalString,
  option2_value: csvOptionalString,
  price: z.coerce.number().optional().nullable(),
  compare_at_price: z.coerce.number().optional().nullable(),
  barcode: csvOptionalString,
  weight_grams: z.coerce.number().optional().nullable(),
  inventory_quantity: z.coerce.number().optional().nullable(),
});

export const mockStoreDiscountCodeRowSchema = z.object({
  code: csvString,
  type: csvOptionalString,
  value: z.coerce.number().optional().nullable(),
  usage_count: z.coerce.number().optional().nullable(),
  starts_at: csvOptionalString,
  ends_at: csvOptionalString,
});

export const mockStoreEmailCampaignRowSchema = z.object({
  campaign_id: csvString,
  name: csvOptionalString,
  type: csvOptionalString,
  sent_at: csvOptionalString,
  recipients: z.coerce.number().optional().nullable(),
  opens: z.coerce.number().optional().nullable(),
  clicks: z.coerce.number().optional().nullable(),
  unsubscribes: z.coerce.number().optional().nullable(),
  attributed_orders: z.coerce.number().optional().nullable(),
  attributed_revenue_gbp: z.coerce.number().optional().nullable(),
});

export const mockStorePurchaseOrderRowSchema = z.object({
  po_id: csvString,
  supplier_id: csvOptionalString,
  created_at: csvOptionalString,
  expected_delivery: csvOptionalString,
  actual_delivery: csvOptionalString,
  status: csvOptionalString,
  total_cost_supplier_ccy: z.coerce.number().optional().nullable(),
  total_cost_gbp: z.coerce.number().optional().nullable(),
  deposit_paid_at: csvOptionalString,
  balance_paid_at: csvOptionalString,
});

export const mockStoreBankTransactionRowSchema = z.object({
  transaction_id: csvString,
  date: csvString,
  description: csvOptionalString,
  amount_gbp: z.coerce.number().optional().nullable(),
  balance_gbp: z.coerce.number().optional().nullable(),
  counterparty: csvOptionalString,
  category: csvOptionalString,
  raw_category: csvOptionalString,
});

export const mockStoreOrderRowSchema = z.object({
  order_id: csvString,
  order_number: z.coerce.number().optional().nullable(),
  customer_id: csvString,
  created_at: csvOptionalString,
  currency: csvOptionalString,
  subtotal: z.coerce.number().optional().nullable(),
  total_discounts: z.coerce.number().optional().nullable(),
  total_shipping: z.coerce.number().optional().nullable(),
  total_tax: z.coerce.number().optional().nullable(),
  total_price: z.coerce.number().optional().nullable(),
  financial_status: csvOptionalString,
  fulfillment_status: csvOptionalString,
  utm_source: csvOptionalString,
  utm_medium: csvOptionalString,
  utm_campaign: csvOptionalString,
  landing_site: csvOptionalString,
  referring_site: csvOptionalString,
  tags: csvOptionalString,
  discount_code: csvOptionalString,
});

export const mockStoreLineItemRowSchema = z.object({
  line_item_id: csvString,
  order_id: csvString,
  variant_id: csvString,
  product_id: csvString,
  title: csvOptionalString,
  quantity: z.coerce.number().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  total_discount: z.coerce.number().optional().nullable(),
});

export const mockStoreRefundRowSchema = z.object({
  refund_id: csvString,
  order_id: csvString,
  created_at: csvOptionalString,
  amount: z.coerce.number().optional().nullable(),
  reason: csvOptionalString,
  refund_line_items: csvJsonArray,
});

export const mockStoreInventoryMovementRowSchema = z.object({
  movement_id: csvString,
  variant_id: csvString,
  date: csvString,
  type: csvOptionalString,
  quantity_delta: z.coerce.number().optional().nullable(),
  running_balance: z.coerce.number().optional().nullable(),
  reference_id: csvOptionalString,
});

export const mockStoreProductCollectionRowSchema = z.object({
  product_id: csvString,
  collection_id: csvString,
});

export const mockStoreAddressRowSchema = z.object({
  customer_id: csvString,
  first_name: csvOptionalString,
  last_name: csvOptionalString,
  address1: csvOptionalString,
  address2: csvOptionalString,
  city: csvOptionalString,
  province: csvOptionalString,
  postcode: csvOptionalString,
  country: csvOptionalString,
});

export const mockStoreEmailEventRowSchema = z.object({
  event_id: csvString,
  campaign_id: csvString,
  customer_id: csvOptionalString,
  event_type: csvOptionalString,
  timestamp: csvOptionalString,
});

export const mockStoreSupportTicketRowSchema = z.object({
  ticket_id: csvString,
  customer_id: csvString,
  related_order_id: csvOptionalString,
  related_product_id: csvOptionalString,
  created_at: csvOptionalString,
  channel: csvOptionalString,
  status: csvOptionalString,
  priority: csvOptionalString,
  category: csvOptionalString,
  subject: csvOptionalString,
  first_response_at: csvOptionalString,
  resolved_at: csvOptionalString,
  resolution_time_minutes: z.coerce.number().optional().nullable(),
  satisfaction_rating: z.coerce.number().optional().nullable(),
  resolved_by: csvOptionalString,
});

export const mockStoreSupportMessageRowSchema = z.object({
  ticket_id: csvString,
  messages: csvJsonArray,
});

export const mockStorePoLineItemRowSchema = z.object({
  po_line_id: csvString,
  po_id: csvString,
  variant_id: csvString,
  quantity_ordered: z.coerce.number().optional().nullable(),
  quantity_received: z.coerce.number().optional().nullable(),
  unit_cost_supplier_ccy: z.coerce.number().optional().nullable(),
  landed_cost_per_unit_gbp: z.coerce.number().optional().nullable(),
});

export const mockStoreMetaAdsDailyRowSchema = z.object({
  date: csvString,
  campaign_name: csvString,
  campaign_objective: csvOptionalString,
  ad_set: csvOptionalString,
  ad_name: csvString,
  placement: csvString,
  impressions: z.coerce.number().optional().nullable(),
  clicks: z.coerce.number().optional().nullable(),
  spend_gbp: z.coerce.number().optional().nullable(),
  conversions: z.coerce.number().optional().nullable(),
  conversion_value_gbp: z.coerce.number().optional().nullable(),
});

export const mockStoreGoogleAdsDailyRowSchema = z.object({
  date: csvString,
  campaign_name: csvString,
  campaign_type: csvOptionalString,
  ad_group: csvString,
  impressions: z.coerce.number().optional().nullable(),
  clicks: z.coerce.number().optional().nullable(),
  spend_gbp: z.coerce.number().optional().nullable(),
  conversions: z.coerce.number().optional().nullable(),
  conversion_value_gbp: z.coerce.number().optional().nullable(),
});

/** External id → uuid maps built during two-pass CSV load. */
export interface IdMaps {
  collections: Map<string, string>;
  collectionsByTitle: Map<string, string>;
  products: Map<string, string>;
  customers: Map<string, string>;
  variants: Map<string, string>;
  orders: Map<string, string>;
  purchase_orders: Map<string, string>;
  suppliers: Map<string, string>;
  email_campaigns: Map<string, string>;
  support_tickets: Map<string, string>;
}

type CollectionRow = z.infer<typeof mockStoreCollectionRowSchema>;
type SupplierRow = z.infer<typeof mockStoreSupplierRowSchema>;
type ProductRow = z.infer<typeof mockStoreProductRowSchema>;
type CustomerRow = z.infer<typeof mockStoreCustomerRowSchema>;
type VariantRow = z.infer<typeof mockStoreVariantRowSchema>;
type DiscountCodeRow = z.infer<typeof mockStoreDiscountCodeRowSchema>;
type EmailCampaignRow = z.infer<typeof mockStoreEmailCampaignRowSchema>;
type PurchaseOrderRow = z.infer<typeof mockStorePurchaseOrderRowSchema>;
type BankTransactionRow = z.infer<typeof mockStoreBankTransactionRowSchema>;
type OrderRow = z.infer<typeof mockStoreOrderRowSchema>;
type LineItemRow = z.infer<typeof mockStoreLineItemRowSchema>;
type RefundRow = z.infer<typeof mockStoreRefundRowSchema>;
type InventoryMovementRow = z.infer<typeof mockStoreInventoryMovementRowSchema>;
type ProductCollectionRow = z.infer<typeof mockStoreProductCollectionRowSchema>;
type AddressRow = z.infer<typeof mockStoreAddressRowSchema>;
type EmailEventRow = z.infer<typeof mockStoreEmailEventRowSchema>;
type SupportTicketRow = z.infer<typeof mockStoreSupportTicketRowSchema>;
type SupportMessageRow = z.infer<typeof mockStoreSupportMessageRowSchema>;
type PoLineItemRow = z.infer<typeof mockStorePoLineItemRowSchema>;
type MetaAdsDailyRow = z.infer<typeof mockStoreMetaAdsDailyRowSchema>;
type GoogleAdsDailyRow = z.infer<typeof mockStoreGoogleAdsDailyRowSchema>;

export class MockStoreRows {
  readonly schema = {
    mockStoreCollectionRowSchema: mockStoreCollectionRowSchema,
    mockStoreSupplierRowSchema: mockStoreSupplierRowSchema,
    mockStoreProductRowSchema: mockStoreProductRowSchema,
    mockStoreCustomerRowSchema: mockStoreCustomerRowSchema,
    mockStoreVariantRowSchema: mockStoreVariantRowSchema,
    mockStoreDiscountCodeRowSchema: mockStoreDiscountCodeRowSchema,
    mockStoreEmailCampaignRowSchema: mockStoreEmailCampaignRowSchema,
    mockStorePurchaseOrderRowSchema: mockStorePurchaseOrderRowSchema,
    mockStoreBankTransactionRowSchema: mockStoreBankTransactionRowSchema,
    mockStoreOrderRowSchema: mockStoreOrderRowSchema,
    mockStoreLineItemRowSchema: mockStoreLineItemRowSchema,
    mockStoreRefundRowSchema: mockStoreRefundRowSchema,
    mockStoreInventoryMovementRowSchema: mockStoreInventoryMovementRowSchema,
    mockStoreProductCollectionRowSchema: mockStoreProductCollectionRowSchema,
    mockStoreAddressRowSchema: mockStoreAddressRowSchema,
    mockStoreEmailEventRowSchema: mockStoreEmailEventRowSchema,
    mockStoreSupportTicketRowSchema: mockStoreSupportTicketRowSchema,
    mockStoreSupportMessageRowSchema: mockStoreSupportMessageRowSchema,
    mockStorePoLineItemRowSchema: mockStorePoLineItemRowSchema,
    mockStoreMetaAdsDailyRowSchema: mockStoreMetaAdsDailyRowSchema,
    mockStoreGoogleAdsDailyRowSchema: mockStoreGoogleAdsDailyRowSchema,
  } as const;

  requireId(map: Map<string, string>, externalId: string): string | null {
    return map.get(externalId) ?? null;
  }

  resolveCollectionId(maps: IdMaps, externalIdOrTitle: string): string | null {
    return (
      maps.collections.get(externalIdOrTitle) ??
      maps.collectionsByTitle.get(externalIdOrTitle) ??
      null
    );
  }

  mapCollectionRows(
  rows: CollectionRow[],
  scope: StoreScope,
): TablesInsert<"collections">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.collection_id,
    title: row.title,
    created_at: row.created_at ?? undefined,
  }));
}

mapSupplierRows(
  rows: SupplierRow[],
  scope: StoreScope,
): TablesInsert<"suppliers">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.supplier_id,
    name: row.name,
    country: row.country,
    payment_terms: row.payment_terms,
    lead_time_days: row.lead_time_days,
    currency: row.currency,
  }));
}

mapProductRows(
  rows: ProductRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"products">[] {
  return rows.flatMap((row) => {
    const collectionId = row.collection
      ? this.resolveCollectionId(maps, row.collection)
      : null;
    if (row.collection && collectionId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.product_id,
        title: row.title,
        handle: row.handle,
        description: row.description,
        product_type: row.product_type,
        vendor: row.vendor,
        gender_segment: row.gender_segment,
        tags: row.tags,
        status: row.status,
        created_at: row.created_at ?? undefined,
        collection_id: collectionId,
      },
    ];
  });
}

mapCustomerRows(
  rows: CustomerRow[],
  scope: StoreScope,
): TablesInsert<"customers">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.customer_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    created_at: row.created_at ?? undefined,
    accepts_marketing: row.accepts_marketing,
    total_spent: row.total_spent,
    orders_count: row.orders_count,
    acquisition_source: row.acquisition_source,
    acquisition_date: row.acquisition_date,
    default_country: row.default_country,
    gender_segment_affinity: row.gender_segment_affinity,
  }));
}

mapVariantRows(
  rows: VariantRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"variants">[] {
  return rows.flatMap((row) => {
    const productId = this.requireId(maps.products, row.product_id);
    if (productId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.variant_id,
        product_id: productId,
        sku: row.sku,
        option1_name: row.option1_name,
        option1_value: row.option1_value,
        option2_name: row.option2_name,
        option2_value: row.option2_value,
        price: row.price,
        compare_at_price: row.compare_at_price,
        barcode: row.barcode,
        weight_grams: row.weight_grams,
        inventory_quantity: row.inventory_quantity,
      },
    ];
  });
}

mapDiscountCodeRows(
  rows: DiscountCodeRow[],
  scope: StoreScope,
): TablesInsert<"discount_codes">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.code,
    code: row.code,
    type: row.type,
    value: row.value,
    usage_count: row.usage_count,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  }));
}

mapEmailCampaignRows(
  rows: EmailCampaignRow[],
  scope: StoreScope,
): TablesInsert<"email_campaigns">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.campaign_id,
    name: row.name,
    type: row.type,
    sent_at: row.sent_at,
    recipients: row.recipients,
    opens: row.opens,
    clicks: row.clicks,
    unsubscribes: row.unsubscribes,
    attributed_orders: row.attributed_orders,
    attributed_revenue_gbp: row.attributed_revenue_gbp,
  }));
}

mapPurchaseOrderRows(
  rows: PurchaseOrderRow[],
  scope: StoreScope,
): TablesInsert<"purchase_orders">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.po_id,
    supplier_id: row.supplier_id,
    created_at: row.created_at ?? undefined,
    expected_delivery: row.expected_delivery,
    actual_delivery: row.actual_delivery,
    status: row.status,
    total_cost_supplier_ccy: row.total_cost_supplier_ccy,
    total_cost_gbp: row.total_cost_gbp,
    deposit_paid_at: row.deposit_paid_at,
    balance_paid_at: row.balance_paid_at,
  }));
}

mapBankTransactionRows(
  rows: BankTransactionRow[],
  scope: StoreScope,
): TablesInsert<"bank_transactions">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    external_id: row.transaction_id,
    date: row.date,
    description: row.description,
    amount_gbp: row.amount_gbp,
    balance_gbp: row.balance_gbp,
    counterparty: row.counterparty,
    category: row.category,
    raw_category: row.raw_category,
  }));
}

mapOrderRows(
  rows: OrderRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"orders">[] {
  return rows.flatMap((row) => {
    const customerId = this.requireId(maps.customers, row.customer_id);
    if (customerId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.order_id,
        customer_id: customerId,
        order_number: row.order_number != null ? String(row.order_number) : null,
        created_at: row.created_at ?? undefined,
        currency: row.currency,
        subtotal: row.subtotal,
        total_discounts: row.total_discounts,
        total_shipping: row.total_shipping,
        total_tax: row.total_tax,
        total_price: row.total_price,
        financial_status: row.financial_status,
        fulfillment_status: row.fulfillment_status,
        utm_source: row.utm_source,
        utm_medium: row.utm_medium,
        utm_campaign: row.utm_campaign,
        landing_site: row.landing_site,
        referring_site: row.referring_site,
        tags: row.tags,
        discount_code: row.discount_code,
      },
    ];
  });
}

mapLineItemRows(
  rows: LineItemRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"line_items">[] {
  return rows.flatMap((row) => {
    const orderId = this.requireId(maps.orders, row.order_id);
    const variantId = this.requireId(maps.variants, row.variant_id);
    const productId = this.requireId(maps.products, row.product_id);
    if (orderId == null || variantId == null || productId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.line_item_id,
        order_id: orderId,
        variant_id: variantId,
        product_id: productId,
        title: row.title,
        quantity: row.quantity,
        price: row.price,
        total_discount: row.total_discount,
      },
    ];
  });
}

mapRefundRows(
  rows: RefundRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"refunds">[] {
  return rows.flatMap((row) => {
    const orderId = this.requireId(maps.orders, row.order_id);
    if (orderId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.refund_id,
        order_id: orderId,
        created_at: row.created_at ?? undefined,
        amount: row.amount ?? 0,
        reason: row.reason,
        refund_line_items: row.refund_line_items as Json,
      },
    ];
  });
}

mapInventoryMovementRows(
  rows: InventoryMovementRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"inventory_movements">[] {
  return rows.flatMap((row) => {
    const variantId = this.requireId(maps.variants, row.variant_id);
    if (variantId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.movement_id,
        variant_id: variantId,
        date: row.date,
        type: row.type,
        quantity_delta: row.quantity_delta,
        running_balance: row.running_balance,
        reference_id: row.reference_id,
      },
    ];
  });
}

mapProductCollectionRows(
  rows: ProductCollectionRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"product_collections">[] {
  return rows.flatMap((row) => {
    const productId = this.requireId(maps.products, row.product_id);
    const collectionId = this.requireId(maps.collections, row.collection_id);
    if (productId == null || collectionId == null) return [];

    return [{ organization_id: scope.organizationId,
    store_id: scope.storeId, product_id: productId, collection_id: collectionId }];
  });
}

mapAddressRows(
  rows: AddressRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"addresses">[] {
  return rows.flatMap((row) => {
    const customerId = this.requireId(maps.customers, row.customer_id);
    if (customerId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.customer_id,
        customer_id: customerId,
        first_name: row.first_name,
        last_name: row.last_name,
        address1: row.address1,
        address2: row.address2,
        city: row.city,
        province: row.province,
        postcode: row.postcode,
        country: row.country,
      },
    ];
  });
}

mapEmailEventRows(
  rows: EmailEventRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"email_events">[] {
  return rows.flatMap((row) => {
    const campaignId = this.requireId(maps.email_campaigns, row.campaign_id);
    if (campaignId == null) return [];

    const customerId = row.customer_id
      ? this.requireId(maps.customers, row.customer_id)
      : null;
    if (row.customer_id && customerId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.event_id,
        campaign_id: campaignId,
        customer_id: customerId,
        event_type: row.event_type,
        timestamp: row.timestamp,
      },
    ];
  });
}

mapSupportTicketRows(
  rows: SupportTicketRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"support_tickets">[] {
  return rows.flatMap((row) => {
    const customerId = this.requireId(maps.customers, row.customer_id);
    if (customerId == null) return [];

    const relatedOrderId = row.related_order_id
      ? this.requireId(maps.orders, row.related_order_id)
      : null;
    if (row.related_order_id && relatedOrderId == null) return [];

    const relatedProductId = row.related_product_id
      ? this.requireId(maps.products, row.related_product_id)
      : null;
    if (row.related_product_id && relatedProductId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.ticket_id,
        customer_id: customerId,
        related_order_id: relatedOrderId,
        related_product_id: relatedProductId,
        created_at: row.created_at ?? undefined,
        channel: row.channel,
        status: row.status,
        priority: row.priority,
        category: row.category,
        subject: row.subject,
        first_response_at: row.first_response_at,
        resolved_at: row.resolved_at,
        resolution_time_minutes: row.resolution_time_minutes,
        satisfaction_rating: row.satisfaction_rating,
        resolved_by: row.resolved_by,
      },
    ];
  });
}

mapSupportMessageRows(
  rows: SupportMessageRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"support_messages">[] {
  return rows.flatMap((row) => {
    const ticketId = this.requireId(maps.support_tickets, row.ticket_id);
    if (ticketId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.ticket_id,
        ticket_id: ticketId,
        messages: row.messages as Json,
      },
    ];
  });
}

mapPoLineItemRows(
  rows: PoLineItemRow[],
  scope: StoreScope,
  maps: IdMaps,
): TablesInsert<"po_line_items">[] {
  return rows.flatMap((row) => {
    const poId = this.requireId(maps.purchase_orders, row.po_id);
    const variantId = this.requireId(maps.variants, row.variant_id);
    if (poId == null || variantId == null) return [];

    return [
      {
        organization_id: scope.organizationId,
    store_id: scope.storeId,
        external_id: row.po_line_id,
        po_id: poId,
        variant_id: variantId,
        quantity_ordered: row.quantity_ordered,
        quantity_received: row.quantity_received,
        unit_cost_supplier_ccy: row.unit_cost_supplier_ccy,
        landed_cost_per_unit_gbp: row.landed_cost_per_unit_gbp,
      },
    ];
  });
}

mapMetaAdsDailyRows(
  rows: MetaAdsDailyRow[],
  scope: StoreScope,
): TablesInsert<"meta_ads_daily">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    date: row.date,
    campaign_name: row.campaign_name,
    campaign_objective: row.campaign_objective,
    ad_set: row.ad_set,
    ad_name: row.ad_name,
    placement: row.placement,
    impressions: row.impressions,
    clicks: row.clicks,
    spend_gbp: row.spend_gbp,
    conversions: row.conversions,
    conversion_value_gbp: row.conversion_value_gbp,
  }));
}

mapGoogleAdsDailyRows(
  rows: GoogleAdsDailyRow[],
  scope: StoreScope,
): TablesInsert<"google_ads_daily">[] {
  return rows.map((row) => ({
    organization_id: scope.organizationId,
    store_id: scope.storeId,
    date: row.date,
    campaign_name: row.campaign_name,
    campaign_type: row.campaign_type,
    ad_group: row.ad_group,
    impressions: row.impressions,
    clicks: row.clicks,
    spend_gbp: row.spend_gbp,
    conversions: row.conversions,
    conversion_value_gbp: row.conversion_value_gbp,
  }));
}
}

export const mockStoreRows = new MockStoreRows();
