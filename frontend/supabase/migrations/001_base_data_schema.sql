-- =============================================================
-- 001_base_data_schema.sql
-- Pretty Fly raw data tables — mirrors CSV structure exactly
-- =============================================================

-- Synthetic uuid keys below use gen_random_uuid() (core Postgres 13+, always
-- on Supabase). Avoids uuid-ossp, whose uuid_generate_v4() is not on the
-- search_path during `supabase db push` (the extension lives in the
-- `extensions` schema), which made a fresh CLI push fail.

-- ---- products ------------------------------------------------
create table if not exists products (
  product_id       text primary key,
  title            text,
  handle           text,
  description      text,
  product_type     text,
  vendor           text,
  collection       text,
  gender_segment   text,
  tags             text,
  status           text,
  created_at       timestamptz
);

-- ---- variants ------------------------------------------------
create table if not exists variants (
  variant_id           text primary key,
  product_id           text references products(product_id),
  sku                  text,
  option1_name         text,
  option1_value        text,
  option2_name         text,
  option2_value        text,
  price                numeric,
  compare_at_price     numeric,
  barcode              text,
  weight_grams         numeric,
  inventory_quantity   integer
);

-- ---- customers -----------------------------------------------
create table if not exists customers (
  customer_id               text primary key,
  email                     text,
  first_name                text,
  last_name                 text,
  created_at                timestamptz,
  accepts_marketing         boolean,
  total_spent               numeric,
  orders_count              integer,
  acquisition_source        text,
  acquisition_date          date,
  default_country           text,
  gender_segment_affinity   text
);

-- ---- orders --------------------------------------------------
create table if not exists orders (
  order_id            text primary key,
  order_number        text,
  customer_id         text references customers(customer_id),
  created_at          timestamptz,
  currency            text,
  subtotal            numeric,
  total_discounts     numeric,
  total_shipping      numeric,
  total_tax           numeric,
  total_price         numeric,
  financial_status    text,
  fulfillment_status  text,
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  landing_site        text,
  referring_site      text,
  tags                text,
  discount_code       text
);

-- ---- line_items ----------------------------------------------
create table if not exists line_items (
  line_item_id   text primary key,
  order_id       text references orders(order_id),
  variant_id     text references variants(variant_id),
  product_id     text references products(product_id),
  title          text,
  quantity       integer,
  price          numeric,
  total_discount numeric
);

-- ---- refunds -------------------------------------------------
create table if not exists refunds (
  refund_id         text primary key,
  order_id          text references orders(order_id),
  created_at        timestamptz,
  amount            numeric,
  reason            text,
  refund_line_items text  -- raw JSON string from CSV
);

-- ---- collections ---------------------------------------------
create table if not exists collections (
  collection_id text primary key,
  title         text,
  created_at    timestamptz
);

-- ---- meta_ads_daily ------------------------------------------
create table if not exists meta_ads_daily (
  id                    uuid primary key default gen_random_uuid(),
  date                  date,
  campaign_name         text,
  campaign_objective    text,
  ad_set                text,
  ad_name               text,
  placement             text,
  impressions           integer,
  clicks                integer,
  spend_gbp             numeric,
  conversions           integer,
  conversion_value_gbp  numeric
);

-- ---- google_ads_daily ----------------------------------------
create table if not exists google_ads_daily (
  id                   uuid primary key default gen_random_uuid(),
  date                 date,
  campaign_name        text,
  campaign_type        text,
  ad_group             text,
  impressions          integer,
  clicks               integer,
  spend_gbp            numeric,
  conversions          integer,
  conversion_value_gbp numeric
);

-- ---- inventory_movements -------------------------------------
create table if not exists inventory_movements (
  movement_id      text primary key,
  variant_id       text references variants(variant_id),
  date             date,
  type             text,
  quantity_delta   integer,
  running_balance  integer,
  reference_id     text
);

-- ---- support_tickets ----------------------------------------
create table if not exists support_tickets (
  ticket_id               text primary key,
  customer_id             text references customers(customer_id),
  created_at              timestamptz,
  channel                 text,
  status                  text,
  priority                text,
  category                text,
  subject                 text,
  related_order_id        text,
  related_product_id      text,
  first_response_at       timestamptz,
  resolved_at             timestamptz,
  resolution_time_minutes integer,
  satisfaction_rating     integer,
  resolved_by             text
);

-- ---- purchase_orders ----------------------------------------
create table if not exists purchase_orders (
  po_id                    text primary key,
  supplier_id              text,
  created_at               timestamptz,
  expected_delivery        date,
  actual_delivery          date,
  status                   text,
  total_cost_supplier_ccy  numeric,
  total_cost_gbp           numeric,
  deposit_paid_at          timestamptz,
  balance_paid_at          timestamptz
);

-- ---- po_line_items ------------------------------------------
create table if not exists po_line_items (
  po_line_id                 text primary key,
  po_id                      text references purchase_orders(po_id),
  variant_id                 text references variants(variant_id),
  quantity_ordered           integer,
  quantity_received          integer,
  unit_cost_supplier_ccy     numeric,
  landed_cost_per_unit_gbp   numeric
);
