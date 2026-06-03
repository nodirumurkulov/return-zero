-- Return Zero – Supabase schema
-- Tables: products, variants, refunds, line_items, orders
-- All tables are read-only for the anon role (RLS enabled, SELECT-only policy).

-- ─── products ────────────────────────────────────────────────────────────────
create table if not exists products (
  product_id       text primary key,
  title            text        not null,
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

-- ─── variants ────────────────────────────────────────────────────────────────
create table if not exists variants (
  variant_id          text primary key,
  product_id          text        references products(product_id),
  sku                 text,
  option1_name        text,
  option1_value       text,   -- size label
  option2_name        text,
  option2_value       text,   -- colour label
  price               numeric,
  compare_at_price    numeric,
  barcode             text,
  weight_grams        integer,
  inventory_quantity  integer default 0
);

create index if not exists variants_product_id_idx on variants(product_id);

-- ─── orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  order_id            text primary key,
  order_number        integer,
  customer_id         text,
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

-- ─── line_items ──────────────────────────────────────────────────────────────
create table if not exists line_items (
  line_item_id    text primary key,
  order_id        text        references orders(order_id),
  variant_id      text        references variants(variant_id),
  product_id      text        references products(product_id),
  title           text,
  quantity        integer,
  price           numeric,
  total_discount  numeric
);

create index if not exists line_items_product_id_idx on line_items(product_id);
create index if not exists line_items_order_id_idx   on line_items(order_id);

-- ─── refunds ─────────────────────────────────────────────────────────────────
create table if not exists refunds (
  refund_id           text primary key,
  order_id            text        references orders(order_id),
  created_at          timestamptz,
  amount              numeric,
  reason              text,
  refund_line_items   text    -- raw JSON string of variant_id array
);

create index if not exists refunds_reason_idx on refunds(reason);

-- ─── precomputed fit scores ───────────────────────────────────────────────────
-- Populated by the seed script; updated whenever data changes.
create table if not exists fit_scores (
  product_id              text primary key references products(product_id),
  title                   text,
  product_type            text,
  gender_segment          text,
  price                   numeric,
  colours                 jsonb,    -- ["Washed Black", "Sage"]
  colour_hexes            jsonb,    -- ["#2A2A2A", "#8A9E8A"]
  sizing_return_rate      numeric,
  fit_score               text,     -- A/B/C/D/F
  size_bias               text,     -- runs_small / runs_large / true_to_size / unknown
  size_too_small          integer,
  size_too_large          integer,
  total_sizing_refunds    integer,
  units_sold              integer,
  inventory_by_size       jsonb,    -- {"XS": 10, "S": -5, ...}
  stockout_sizes          jsonb,    -- ["UK11", "UK12"]
  stockout_count          integer,
  demo_order              integer   -- lower = higher priority in demo
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table products   enable row level security;
alter table variants   enable row level security;
alter table orders     enable row level security;
alter table line_items enable row level security;
alter table refunds    enable row level security;
alter table fit_scores enable row level security;

-- Public read access (no auth needed — this is a demo/hackathon project)
create policy "anon_read_products"   on products   for select to anon using (true);
create policy "anon_read_variants"   on variants   for select to anon using (true);
create policy "anon_read_orders"     on orders     for select to anon using (true);
create policy "anon_read_line_items" on line_items for select to anon using (true);
create policy "anon_read_refunds"    on refunds    for select to anon using (true);
create policy "anon_read_fit_scores" on fit_scores for select to anon using (true);
