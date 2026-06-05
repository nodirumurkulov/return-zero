// Contract table specs for onboarding upload. CSV columns map to Postgres columns;
// natural keys from CSV (e.g. product_id) land in external_id. Two-pass load order
// with FK resolution is implemented in contract-loader.ts.

export interface ColumnMap {
  /** CSV header name */
  csv: string;
  /** Postgres column name */
  db: string;
}

export type ForeignRefTable =
  | "collections"
  | "products"
  | "customers"
  | "variants"
  | "orders"
  | "purchase_orders";

export interface ForeignKeySpec {
  /** CSV column containing the parent external id (or collection title) */
  csv: string;
  /** Postgres FK column */
  db: string;
  refTable: ForeignRefTable;
  /** collections only: also match CSV value to collection title */
  matchCollectionTitle?: boolean;
}

export interface TableSpec {
  /** Target Postgres table. */
  table: string;
  /** Expected CSV file / multipart field name. */
  file: string;
  /** CSV column stored as external_id; null for composite-key tables. */
  externalIdColumn: string | null;
  /** Load pass: parents first, then children with FK resolution. */
  pass: 1 | 2;
  /** CSV → DB column mappings (external_id column included when present). */
  columns: ColumnMap[];
  /** FK columns resolved via external_id maps from earlier tables. */
  foreignKeys?: ForeignKeySpec[];
  /** DB columns where empty CSV values become null. */
  nullable?: string[];
  /** DB columns coerced to boolean. */
  booleans?: string[];
  /** DB columns parsed from JSON strings into jsonb. */
  jsonb?: string[];
  /** Upsert conflict columns (DB names); defaults to organization_id,external_id. */
  conflictColumns?: string[];
}

export const TABLE_SPECS: TableSpec[] = [
  {
    table: "collections",
    file: "collections.csv",
    externalIdColumn: "collection_id",
    pass: 1,
    columns: [
      { csv: "collection_id", db: "external_id" },
      { csv: "title", db: "title" },
      { csv: "created_at", db: "created_at" },
    ],
  },
  {
    table: "products",
    file: "products.csv",
    externalIdColumn: "product_id",
    pass: 1,
    columns: [
      { csv: "product_id", db: "external_id" },
      { csv: "title", db: "title" },
      { csv: "handle", db: "handle" },
      { csv: "description", db: "description" },
      { csv: "product_type", db: "product_type" },
      { csv: "vendor", db: "vendor" },
      { csv: "gender_segment", db: "gender_segment" },
      { csv: "tags", db: "tags" },
      { csv: "status", db: "status" },
      { csv: "created_at", db: "created_at" },
    ],
    foreignKeys: [
      {
        csv: "collection",
        db: "collection_id",
        refTable: "collections",
        matchCollectionTitle: true,
      },
    ],
  },
  {
    table: "customers",
    file: "customers.csv",
    externalIdColumn: "customer_id",
    pass: 1,
    columns: [
      { csv: "customer_id", db: "external_id" },
      { csv: "email", db: "email" },
      { csv: "first_name", db: "first_name" },
      { csv: "last_name", db: "last_name" },
      { csv: "created_at", db: "created_at" },
      { csv: "accepts_marketing", db: "accepts_marketing" },
      { csv: "total_spent", db: "total_spent" },
      { csv: "orders_count", db: "orders_count" },
      { csv: "acquisition_source", db: "acquisition_source" },
      { csv: "acquisition_date", db: "acquisition_date" },
      { csv: "default_country", db: "default_country" },
      { csv: "gender_segment_affinity", db: "gender_segment_affinity" },
    ],
    nullable: ["acquisition_date"],
    booleans: ["accepts_marketing"],
  },
  {
    table: "variants",
    file: "variants.csv",
    externalIdColumn: "variant_id",
    pass: 1,
    columns: [
      { csv: "variant_id", db: "external_id" },
      { csv: "sku", db: "sku" },
      { csv: "option1_name", db: "option1_name" },
      { csv: "option1_value", db: "option1_value" },
      { csv: "option2_name", db: "option2_name" },
      { csv: "option2_value", db: "option2_value" },
      { csv: "price", db: "price" },
      { csv: "compare_at_price", db: "compare_at_price" },
      { csv: "barcode", db: "barcode" },
      { csv: "weight_grams", db: "weight_grams" },
      { csv: "inventory_quantity", db: "inventory_quantity" },
    ],
    foreignKeys: [{ csv: "product_id", db: "product_id", refTable: "products" }],
    nullable: ["compare_at_price"],
  },
  {
    table: "purchase_orders",
    file: "purchase_orders.csv",
    externalIdColumn: "po_id",
    pass: 1,
    columns: [
      { csv: "po_id", db: "external_id" },
      { csv: "supplier_id", db: "supplier_id" },
      { csv: "created_at", db: "created_at" },
      { csv: "expected_delivery", db: "expected_delivery" },
      { csv: "actual_delivery", db: "actual_delivery" },
      { csv: "status", db: "status" },
      { csv: "total_cost_supplier_ccy", db: "total_cost_supplier_ccy" },
      { csv: "total_cost_gbp", db: "total_cost_gbp" },
      { csv: "deposit_paid_at", db: "deposit_paid_at" },
      { csv: "balance_paid_at", db: "balance_paid_at" },
    ],
    nullable: ["expected_delivery", "actual_delivery", "deposit_paid_at", "balance_paid_at"],
  },
  {
    table: "orders",
    file: "orders.csv",
    externalIdColumn: "order_id",
    pass: 2,
    columns: [
      { csv: "order_id", db: "external_id" },
      { csv: "order_number", db: "order_number" },
      { csv: "created_at", db: "created_at" },
      { csv: "currency", db: "currency" },
      { csv: "subtotal", db: "subtotal" },
      { csv: "total_discounts", db: "total_discounts" },
      { csv: "total_shipping", db: "total_shipping" },
      { csv: "total_tax", db: "total_tax" },
      { csv: "total_price", db: "total_price" },
      { csv: "financial_status", db: "financial_status" },
      { csv: "fulfillment_status", db: "fulfillment_status" },
      { csv: "utm_source", db: "utm_source" },
      { csv: "utm_medium", db: "utm_medium" },
      { csv: "utm_campaign", db: "utm_campaign" },
      { csv: "landing_site", db: "landing_site" },
      { csv: "referring_site", db: "referring_site" },
      { csv: "tags", db: "tags" },
      { csv: "discount_code", db: "discount_code" },
    ],
    foreignKeys: [{ csv: "customer_id", db: "customer_id", refTable: "customers" }],
  },
  {
    table: "line_items",
    file: "line_items.csv",
    externalIdColumn: "line_item_id",
    pass: 2,
    columns: [
      { csv: "line_item_id", db: "external_id" },
      { csv: "title", db: "title" },
      { csv: "quantity", db: "quantity" },
      { csv: "price", db: "price" },
      { csv: "total_discount", db: "total_discount" },
    ],
    foreignKeys: [
      { csv: "order_id", db: "order_id", refTable: "orders" },
      { csv: "variant_id", db: "variant_id", refTable: "variants" },
      { csv: "product_id", db: "product_id", refTable: "products" },
    ],
  },
  {
    table: "refunds",
    file: "refunds.csv",
    externalIdColumn: "refund_id",
    pass: 2,
    columns: [
      { csv: "refund_id", db: "external_id" },
      { csv: "created_at", db: "created_at" },
      { csv: "amount", db: "amount" },
      { csv: "reason", db: "reason" },
      { csv: "refund_line_items", db: "refund_line_items" },
    ],
    foreignKeys: [{ csv: "order_id", db: "order_id", refTable: "orders" }],
    jsonb: ["refund_line_items"],
  },
  {
    table: "inventory_movements",
    file: "inventory_movements.csv",
    externalIdColumn: "movement_id",
    pass: 2,
    columns: [
      { csv: "movement_id", db: "external_id" },
      { csv: "date", db: "date" },
      { csv: "type", db: "type" },
      { csv: "quantity_delta", db: "quantity_delta" },
      { csv: "running_balance", db: "running_balance" },
      { csv: "reference_id", db: "reference_id" },
    ],
    foreignKeys: [{ csv: "variant_id", db: "variant_id", refTable: "variants" }],
  },
  {
    table: "support_tickets",
    file: "support_tickets.csv",
    externalIdColumn: "ticket_id",
    pass: 2,
    columns: [
      { csv: "ticket_id", db: "external_id" },
      { csv: "created_at", db: "created_at" },
      { csv: "channel", db: "channel" },
      { csv: "status", db: "status" },
      { csv: "priority", db: "priority" },
      { csv: "category", db: "category" },
      { csv: "subject", db: "subject" },
      { csv: "first_response_at", db: "first_response_at" },
      { csv: "resolved_at", db: "resolved_at" },
      { csv: "resolution_time_minutes", db: "resolution_time_minutes" },
      { csv: "satisfaction_rating", db: "satisfaction_rating" },
      { csv: "resolved_by", db: "resolved_by" },
    ],
    foreignKeys: [
      { csv: "customer_id", db: "customer_id", refTable: "customers" },
      { csv: "related_order_id", db: "related_order_id", refTable: "orders" },
      { csv: "related_product_id", db: "related_product_id", refTable: "products" },
    ],
    nullable: [
      "related_order_id",
      "related_product_id",
      "first_response_at",
      "resolved_at",
      "resolution_time_minutes",
      "satisfaction_rating",
    ],
  },
  {
    table: "po_line_items",
    file: "po_line_items.csv",
    externalIdColumn: "po_line_id",
    pass: 2,
    columns: [
      { csv: "po_line_id", db: "external_id" },
      { csv: "quantity_ordered", db: "quantity_ordered" },
      { csv: "quantity_received", db: "quantity_received" },
      { csv: "unit_cost_supplier_ccy", db: "unit_cost_supplier_ccy" },
      { csv: "landed_cost_per_unit_gbp", db: "landed_cost_per_unit_gbp" },
    ],
    foreignKeys: [
      { csv: "po_id", db: "po_id", refTable: "purchase_orders" },
      { csv: "variant_id", db: "variant_id", refTable: "variants" },
    ],
  },
  {
    table: "meta_ads_daily",
    file: "meta_ads_daily.csv",
    externalIdColumn: null,
    pass: 2,
    conflictColumns: ["date", "campaign_name", "ad_name", "placement"],
    columns: [
      { csv: "date", db: "date" },
      { csv: "campaign_name", db: "campaign_name" },
      { csv: "campaign_objective", db: "campaign_objective" },
      { csv: "ad_set", db: "ad_set" },
      { csv: "ad_name", db: "ad_name" },
      { csv: "placement", db: "placement" },
      { csv: "impressions", db: "impressions" },
      { csv: "clicks", db: "clicks" },
      { csv: "spend_gbp", db: "spend_gbp" },
      { csv: "conversions", db: "conversions" },
      { csv: "conversion_value_gbp", db: "conversion_value_gbp" },
    ],
  },
  {
    table: "google_ads_daily",
    file: "google_ads_daily.csv",
    externalIdColumn: null,
    pass: 2,
    conflictColumns: ["date", "campaign_name", "ad_group"],
    columns: [
      { csv: "date", db: "date" },
      { csv: "campaign_name", db: "campaign_name" },
      { csv: "campaign_type", db: "campaign_type" },
      { csv: "ad_group", db: "ad_group" },
      { csv: "impressions", db: "impressions" },
      { csv: "clicks", db: "clicks" },
      { csv: "spend_gbp", db: "spend_gbp" },
      { csv: "conversions", db: "conversions" },
      { csv: "conversion_value_gbp", db: "conversion_value_gbp" },
    ],
  },
];

/** Expected upload field names (one per contract file). */
export const CONTRACT_FILES: string[] = TABLE_SPECS.map((s) => s.file);
