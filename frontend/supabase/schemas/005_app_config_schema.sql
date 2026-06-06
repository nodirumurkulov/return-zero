-- =============================================================
-- 004_app_config_schema.sql
-- Org-scoped metrics config, baselines, forecast rules, store connections.
-- =============================================================

-- ---- metric_definitions --------------------------------------
create table public.metric_definitions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  metric_key          text not null,
  display_name        text not null,
  description         text,
  unit                public.metric_unit not null default 'ratio',
  numerator_source    text not null,
  numerator_field     text not null,
  denominator_source  text,
  denominator_field   text,
  operation           public.metric_operation not null default 'ratio',
  window_days         integer not null default 30,
  direction           public.metric_direction not null,
  default_threshold   numeric not null,
  severity            public.metric_severity not null default 'medium',
  enabled             boolean not null default true,
  sort_order          integer not null default 0,
  impact_source       text,
  impact_field        text,
  impact_label        text,
  created_at          timestamptz not null default now(),
  unique (organization_id, metric_key)
);

create index idx_metric_definitions_organization_id
  on public.metric_definitions (organization_id);

-- ---- product_kpi_thresholds ----------------------------------
create table public.product_kpi_thresholds (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  product_id            uuid not null references public.products(id) on delete cascade,
  metric_definition_id  uuid not null references public.metric_definitions(id) on delete cascade,
  threshold             numeric not null,
  direction             public.metric_direction,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  unique (organization_id, product_id, metric_definition_id)
);

create index idx_product_kpi_thresholds_lookup
  on public.product_kpi_thresholds (organization_id, product_id, metric_definition_id);

-- ---- product_baselines ---------------------------------------
create table public.product_baselines (
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  product_id            uuid not null references public.products(id) on delete cascade,
  metric_definition_id  uuid not null references public.metric_definitions(id) on delete cascade,
  mean                  numeric not null,
  stddev                numeric not null,
  sample_n              integer not null,
  computed_at           timestamptz not null default now(),
  primary key (organization_id, product_id, metric_definition_id)
);

create index idx_product_baselines_lookup
  on public.product_baselines (organization_id, product_id, metric_definition_id);

-- ---- business_settings ---------------------------------------
create table public.business_settings (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key             text not null,
  value           numeric not null,
  label           text,
  primary key (organization_id, key)
);

-- ---- forecast_rules ------------------------------------------
create table public.forecast_rules (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  rule_key         text not null,
  kind             public.forecast_rule_kind not null,
  horizon_days     integer not null default 30,
  threshold        numeric not null,
  severity         public.metric_severity not null default 'medium',
  enabled          boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (organization_id, rule_key)
);

create index idx_forecast_rules_organization_id
  on public.forecast_rules (organization_id);

-- ---- business_reports ----------------------------------------
create table public.business_reports (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  summary          jsonb not null,
  narrative        text,
  created_at       timestamptz not null default now()
);

create index idx_business_reports_organization_created
  on public.business_reports (organization_id, created_at desc);

-- ---- store_connections (multi-store per org) -------------------
create table public.store_connections (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  platform         public.store_platform not null default 'mock_csv',
  sync_mode        public.store_sync_mode not null default 'static',
  status           public.store_connection_status not null default 'pending',
  replay_cursor    date,
  external_shop_id text,
  label            text,
  sync_error       text,
  connected_at     timestamptz,
  last_synced_at   timestamptz,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, id)
);

create index idx_store_connections_organization_id
  on public.store_connections (organization_id);

create unique index store_connections_one_mock_per_org
  on public.store_connections (organization_id)
  where platform = 'mock_csv';

create unique index store_connections_shopify_shop_per_org
  on public.store_connections (organization_id, external_shop_id)
  where platform = 'shopify' and external_shop_id is not null;

alter table public.organizations
  add constraint organizations_active_store_id_fkey
  foreign key (active_store_id) references public.store_connections (id) on delete set null;

-- ---- store_id foreign keys (requires store_connections) --------
alter table public.collections
  add constraint collections_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.products
  add constraint products_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.variants
  add constraint variants_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.customers
  add constraint customers_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.orders
  add constraint orders_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.line_items
  add constraint line_items_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.refunds
  add constraint refunds_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.meta_ads_daily
  add constraint meta_ads_daily_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.google_ads_daily
  add constraint google_ads_daily_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.inventory_movements
  add constraint inventory_movements_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.support_tickets
  add constraint support_tickets_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.purchase_orders
  add constraint purchase_orders_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.po_line_items
  add constraint po_line_items_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.suppliers
  add constraint suppliers_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.product_collections
  add constraint product_collections_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.addresses
  add constraint addresses_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.discount_codes
  add constraint discount_codes_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.email_campaigns
  add constraint email_campaigns_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.email_events
  add constraint email_events_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.support_messages
  add constraint support_messages_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
alter table public.bank_transactions
  add constraint bank_transactions_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
