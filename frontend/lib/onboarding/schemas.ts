// Contract table specs for the onboarding upload. Column allow-lists + keys are
// lifted from frontend/scripts/seed.ts so an uploaded CSV maps to the exact same
// shape. Ordered FK-safe (parents before children) for truncate+reload.
//
// NB: this accepts ONLY our contract files. Flexible "any tables/columns"
// ingestion (LLM-assisted mapping) is RUN-84.

export interface TableSpec {
  /** Target Postgres table. */
  table: string;
  /** Expected CSV file / multipart field name. */
  file: string;
  /** Upsert conflict column, or null = plain insert (uuid pk, no natural key). */
  key: string | null;
  /** Allow-listed contract columns (extra CSV columns ignored). */
  columns: string[];
  /** Columns where an empty string should become null. */
  nullable?: string[];
  /** Columns coerced to boolean. */
  booleans?: string[];
}

export const TABLE_SPECS: TableSpec[] = [
  {
    table: "products",
    file: "products.csv",
    key: "product_id",
    columns: ["product_id", "title", "handle", "description", "product_type", "vendor", "collection", "gender_segment", "tags", "status", "created_at"],
  },
  {
    table: "customers",
    file: "customers.csv",
    key: "customer_id",
    columns: ["customer_id", "email", "first_name", "last_name", "created_at", "accepts_marketing", "total_spent", "orders_count", "acquisition_source", "acquisition_date", "default_country", "gender_segment_affinity"],
    nullable: ["acquisition_date"],
    booleans: ["accepts_marketing"],
  },
  {
    table: "collections",
    file: "collections.csv",
    key: "collection_id",
    columns: ["collection_id", "title", "created_at"],
  },
  {
    table: "variants",
    file: "variants.csv",
    key: "variant_id",
    columns: ["variant_id", "product_id", "sku", "option1_name", "option1_value", "option2_name", "option2_value", "price", "compare_at_price", "barcode", "weight_grams", "inventory_quantity"],
    nullable: ["compare_at_price"],
  },
  {
    table: "orders",
    file: "orders.csv",
    key: "order_id",
    columns: ["order_id", "order_number", "customer_id", "created_at", "currency", "subtotal", "total_discounts", "total_shipping", "total_tax", "total_price", "financial_status", "fulfillment_status", "utm_source", "utm_medium", "utm_campaign", "landing_site", "referring_site", "tags", "discount_code"],
  },
  {
    table: "line_items",
    file: "line_items.csv",
    key: "line_item_id",
    columns: ["line_item_id", "order_id", "variant_id", "product_id", "title", "quantity", "price", "total_discount"],
  },
  {
    table: "refunds",
    file: "refunds.csv",
    key: "refund_id",
    columns: ["refund_id", "order_id", "created_at", "amount", "reason", "refund_line_items"],
  },
  {
    table: "inventory_movements",
    file: "inventory_movements.csv",
    key: "movement_id",
    columns: ["movement_id", "variant_id", "date", "type", "quantity_delta", "running_balance", "reference_id"],
  },
  {
    table: "support_tickets",
    file: "support_tickets.csv",
    key: "ticket_id",
    columns: ["ticket_id", "customer_id", "created_at", "channel", "status", "priority", "category", "subject", "related_order_id", "related_product_id", "first_response_at", "resolved_at", "resolution_time_minutes", "satisfaction_rating", "resolved_by"],
    nullable: ["related_order_id", "related_product_id", "first_response_at", "resolved_at", "resolution_time_minutes", "satisfaction_rating"],
  },
  {
    table: "purchase_orders",
    file: "purchase_orders.csv",
    key: "po_id",
    columns: ["po_id", "supplier_id", "created_at", "expected_delivery", "actual_delivery", "status", "total_cost_supplier_ccy", "total_cost_gbp", "deposit_paid_at", "balance_paid_at"],
    nullable: ["expected_delivery", "actual_delivery", "deposit_paid_at", "balance_paid_at"],
  },
  {
    table: "po_line_items",
    file: "po_line_items.csv",
    key: "po_line_id",
    columns: ["po_line_id", "po_id", "variant_id", "quantity_ordered", "quantity_received", "unit_cost_supplier_ccy", "landed_cost_per_unit_gbp"],
  },
  {
    table: "meta_ads_daily",
    file: "meta_ads_daily.csv",
    key: null,
    columns: ["date", "campaign_name", "campaign_objective", "ad_set", "ad_name", "placement", "impressions", "clicks", "spend_gbp", "conversions", "conversion_value_gbp"],
  },
  {
    table: "google_ads_daily",
    file: "google_ads_daily.csv",
    key: null,
    columns: ["date", "campaign_name", "campaign_type", "ad_group", "impressions", "clicks", "spend_gbp", "conversions", "conversion_value_gbp"],
  },
];

/** Expected upload field names (one per contract file). */
export const CONTRACT_FILES: string[] = TABLE_SPECS.map((s) => s.file);
