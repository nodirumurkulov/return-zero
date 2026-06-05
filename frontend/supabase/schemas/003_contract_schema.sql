-- =============================================================
-- 003_contract_schema.sql
-- Org-scoped ecommerce contract data with uuid PKs + external_id.
-- =============================================================

-- ---- collections ---------------------------------------------
create table public.collections (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  title            text,
  created_at       timestamptz not null default now(),
  unique (organization_id, external_id)
);

create index idx_collections_organization_id on public.collections (organization_id);

-- ---- products ------------------------------------------------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  collection_id    uuid references public.collections(id) on delete set null,
  title            text,
  handle           text,
  description      text,
  product_type     text,
  vendor           text,
  gender_segment   text,
  tags             text,
  status           text,
  created_at       timestamptz not null default now(),
  unique (organization_id, external_id)
);

create index idx_products_organization_id on public.products (organization_id);
create index idx_products_organization_external on public.products (organization_id, external_id);

-- ---- variants ------------------------------------------------
create table public.variants (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  external_id        text not null,
  product_id         uuid not null references public.products(id) on delete cascade,
  sku                text,
  option1_name       text,
  option1_value      text,
  option2_name       text,
  option2_value      text,
  price              numeric(14, 2) check (price is null or price >= 0),
  compare_at_price   numeric(14, 2) check (compare_at_price is null or compare_at_price >= 0),
  barcode            text,
  weight_grams       numeric,
  inventory_quantity integer,
  unique (organization_id, external_id)
);

create index idx_variants_organization_id on public.variants (organization_id);
create index idx_variants_product_id on public.variants (product_id);

-- ---- customers -----------------------------------------------
create table public.customers (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  external_id             text not null,
  email                   text,
  first_name              text,
  last_name               text,
  created_at              timestamptz not null default now(),
  accepts_marketing       boolean,
  total_spent             numeric(14, 2) check (total_spent is null or total_spent >= 0),
  orders_count            integer,
  acquisition_source      text,
  acquisition_date        date,
  default_country         text,
  gender_segment_affinity text,
  unique (organization_id, external_id)
);

create index idx_customers_organization_id on public.customers (organization_id);

-- ---- orders --------------------------------------------------
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  external_id        text not null,
  order_number       text,
  customer_id        uuid references public.customers(id) on delete set null,
  created_at         timestamptz not null default now(),
  currency           text,
  subtotal           numeric(14, 2) check (subtotal is null or subtotal >= 0),
  total_discounts    numeric(14, 2) check (total_discounts is null or total_discounts >= 0),
  total_shipping     numeric(14, 2) check (total_shipping is null or total_shipping >= 0),
  total_tax          numeric(14, 2) check (total_tax is null or total_tax >= 0),
  total_price        numeric(14, 2) check (total_price is null or total_price >= 0),
  financial_status   text,
  fulfillment_status text,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  landing_site       text,
  referring_site     text,
  tags               text,
  discount_code      text,
  unique (organization_id, external_id)
);

create index idx_orders_organization_id on public.orders (organization_id);
create index idx_orders_organization_created on public.orders (organization_id, created_at);
create index idx_orders_utm_campaign on public.orders (organization_id, utm_campaign);

-- ---- line_items ----------------------------------------------
create table public.line_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  order_id         uuid not null references public.orders(id) on delete cascade,
  variant_id       uuid references public.variants(id) on delete set null,
  product_id       uuid not null references public.products(id) on delete cascade,
  title            text,
  quantity         integer,
  price            numeric(14, 2) check (price is null or price >= 0),
  total_discount   numeric(14, 2) check (total_discount is null or total_discount >= 0),
  unique (organization_id, external_id)
);

create index idx_line_items_organization_id on public.line_items (organization_id);
create index idx_line_items_order_id on public.line_items (order_id);
create index idx_line_items_product_id on public.line_items (product_id);

-- ---- refunds -------------------------------------------------
create table public.refunds (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  external_id        text not null,
  order_id           uuid not null references public.orders(id) on delete cascade,
  created_at         timestamptz not null default now(),
  amount             numeric(14, 2) not null check (amount >= 0),
  reason             text,
  refund_line_items  jsonb not null default '[]'::jsonb,
  unique (organization_id, external_id)
);

create index idx_refunds_organization_id on public.refunds (organization_id);
create index idx_refunds_order_id on public.refunds (order_id);
create index idx_refunds_organization_created on public.refunds (organization_id, created_at);

-- ---- meta_ads_daily ------------------------------------------
create table public.meta_ads_daily (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  date                 date not null,
  campaign_name        text not null,
  campaign_objective   text,
  ad_set               text,
  ad_name              text not null default '',
  placement            text not null default '',
  impressions          integer,
  clicks               integer,
  spend_gbp            numeric(14, 2) check (spend_gbp is null or spend_gbp >= 0),
  conversions          integer,
  conversion_value_gbp numeric(14, 2) check (conversion_value_gbp is null or conversion_value_gbp >= 0),
  unique (organization_id, date, campaign_name, ad_name, placement)
);

create index idx_meta_ads_organization_date on public.meta_ads_daily (organization_id, date);

-- ---- google_ads_daily ----------------------------------------
create table public.google_ads_daily (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  date                 date not null,
  campaign_name        text not null,
  campaign_type        text,
  ad_group             text not null default '',
  impressions          integer,
  clicks               integer,
  spend_gbp            numeric(14, 2) check (spend_gbp is null or spend_gbp >= 0),
  conversions          integer,
  conversion_value_gbp numeric(14, 2) check (conversion_value_gbp is null or conversion_value_gbp >= 0),
  unique (organization_id, date, campaign_name, ad_group)
);

create index idx_google_ads_organization_date on public.google_ads_daily (organization_id, date);

-- ---- inventory_movements -------------------------------------
create table public.inventory_movements (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  variant_id       uuid not null references public.variants(id) on delete cascade,
  date             date not null,
  type             text,
  quantity_delta   integer,
  running_balance  integer,
  reference_id     text,
  unique (organization_id, external_id)
);

create index idx_inventory_movements_variant_date
  on public.inventory_movements (organization_id, variant_id, date);

-- ---- support_tickets ----------------------------------------
create table public.support_tickets (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  external_id             text not null,
  customer_id             uuid references public.customers(id) on delete set null,
  created_at              timestamptz not null default now(),
  channel                 text,
  status                  text,
  priority                text,
  category                text,
  subject                 text,
  related_order_id        uuid references public.orders(id) on delete set null,
  related_product_id      uuid references public.products(id) on delete set null,
  first_response_at       timestamptz,
  resolved_at             timestamptz,
  resolution_time_minutes integer,
  satisfaction_rating     integer,
  resolved_by             text,
  unique (organization_id, external_id)
);

create index idx_support_tickets_organization_id on public.support_tickets (organization_id);
create index idx_support_tickets_organization_created on public.support_tickets (organization_id, created_at);
create index idx_support_tickets_related_product on public.support_tickets (organization_id, related_product_id);

-- ---- purchase_orders ----------------------------------------
create table public.purchase_orders (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  external_id             text not null,
  supplier_id             text,
  created_at              timestamptz not null default now(),
  expected_delivery       date,
  actual_delivery         date,
  status                  text,
  total_cost_supplier_ccy numeric(14, 2) check (total_cost_supplier_ccy is null or total_cost_supplier_ccy >= 0),
  total_cost_gbp          numeric(14, 2) check (total_cost_gbp is null or total_cost_gbp >= 0),
  deposit_paid_at         timestamptz,
  balance_paid_at         timestamptz,
  unique (organization_id, external_id)
);

create index idx_purchase_orders_organization_id on public.purchase_orders (organization_id);

-- ---- po_line_items ------------------------------------------
create table public.po_line_items (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  external_id              text not null,
  po_id                    uuid not null references public.purchase_orders(id) on delete cascade,
  variant_id               uuid not null references public.variants(id) on delete cascade,
  quantity_ordered         integer,
  quantity_received        integer,
  unit_cost_supplier_ccy   numeric(14, 2) check (unit_cost_supplier_ccy is null or unit_cost_supplier_ccy >= 0),
  landed_cost_per_unit_gbp numeric(14, 2) check (landed_cost_per_unit_gbp is null or landed_cost_per_unit_gbp >= 0),
  unique (organization_id, external_id)
);

create index idx_po_line_items_organization_id on public.po_line_items (organization_id);
