import { z } from "zod";

const shopifyIdSchema = z.union([z.number(), z.string()]).transform(String);

export const shopifyCollectionSchema = z
  .object({
    id: shopifyIdSchema,
    title: z.string().nullable().optional(),
    published_at: z.string().nullable().optional(),
  })
  .passthrough();

export const shopifyVariantSchema = z
  .object({
    id: shopifyIdSchema,
    product_id: shopifyIdSchema,
    sku: z.string().nullable().optional(),
    option1: z.string().nullable().optional(),
    option2: z.string().nullable().optional(),
    option3: z.string().nullable().optional(),
    price: z.union([z.string(), z.number()]).nullable().optional(),
    compare_at_price: z.union([z.string(), z.number()]).nullable().optional(),
    barcode: z.string().nullable().optional(),
    grams: z.number().nullable().optional(),
    weight: z.number().nullable().optional(),
    weight_unit: z.string().nullable().optional(),
    inventory_quantity: z.number().nullable().optional(),
  })
  .passthrough();

export const shopifyProductSchema = z
  .object({
    id: shopifyIdSchema,
    title: z.string().nullable().optional(),
    handle: z.string().nullable().optional(),
    body_html: z.string().nullable().optional(),
    product_type: z.string().nullable().optional(),
    vendor: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    options: z
      .array(
        z.object({
          name: z.string(),
          values: z.array(z.string()).optional(),
        }),
      )
      .optional(),
    variants: z.array(shopifyVariantSchema).optional(),
  })
  .passthrough();

export const shopifyCollectSchema = z
  .object({
    product_id: shopifyIdSchema,
    collection_id: shopifyIdSchema,
  })
  .passthrough();

export const shopifyCustomerSchema = z
  .object({
    id: shopifyIdSchema,
    email: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    accepts_marketing: z.boolean().nullable().optional(),
    total_spent: z.union([z.string(), z.number()]).nullable().optional(),
    orders_count: z.number().nullable().optional(),
    tags: z.string().nullable().optional(),
    default_address: z
      .object({
        country: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export const shopifyLineItemSchema = z
  .object({
    id: shopifyIdSchema,
    variant_id: shopifyIdSchema.nullable().optional(),
    product_id: shopifyIdSchema.nullable().optional(),
    title: z.string().nullable().optional(),
    quantity: z.number().nullable().optional(),
    price: z.union([z.string(), z.number()]).nullable().optional(),
    total_discount: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

export const shopifyRefundLineItemSchema = z
  .object({
    line_item_id: shopifyIdSchema.nullable().optional(),
    quantity: z.number().nullable().optional(),
    subtotal: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

export const shopifyRefundSchema = z
  .object({
    id: shopifyIdSchema,
    created_at: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    refund_line_items: z.array(shopifyRefundLineItemSchema).optional(),
    transactions: z
      .array(
        z.object({
          amount: z.union([z.string(), z.number()]).nullable().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

export const shopifyOrderSchema = z
  .object({
    id: shopifyIdSchema,
    order_number: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    customer: z.object({ id: shopifyIdSchema }).nullable().optional(),
    created_at: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    subtotal_price: z.union([z.string(), z.number()]).nullable().optional(),
    total_discounts: z.union([z.string(), z.number()]).nullable().optional(),
    total_shipping_price_set: z
      .object({
        shop_money: z.object({ amount: z.union([z.string(), z.number()]) }).optional(),
      })
      .nullable()
      .optional(),
    total_tax: z.union([z.string(), z.number()]).nullable().optional(),
    total_price: z.union([z.string(), z.number()]).nullable().optional(),
    financial_status: z.string().nullable().optional(),
    fulfillment_status: z.string().nullable().optional(),
    landing_site: z.string().nullable().optional(),
    referring_site: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    discount_codes: z.array(z.object({ code: z.string() })).optional(),
    line_items: z.array(shopifyLineItemSchema).optional(),
    refunds: z.array(shopifyRefundSchema).optional(),
  })
  .passthrough();

export type ShopifyCollection = z.infer<typeof shopifyCollectionSchema>;
export type ShopifyProduct = z.infer<typeof shopifyProductSchema>;
export type ShopifyVariant = z.infer<typeof shopifyVariantSchema>;
export type ShopifyCollect = z.infer<typeof shopifyCollectSchema>;
export type ShopifyCustomer = z.infer<typeof shopifyCustomerSchema>;
export type ShopifyOrder = z.infer<typeof shopifyOrderSchema>;
export type ShopifyLineItem = z.infer<typeof shopifyLineItemSchema>;
export type ShopifyRefund = z.infer<typeof shopifyRefundSchema>;
