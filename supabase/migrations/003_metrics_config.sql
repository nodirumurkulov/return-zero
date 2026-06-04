-- =============================================================
-- 003_metrics_config.sql
-- Config-driven metrics layer.
--
-- KPIs are DATA, not hardcoded SQL/code. `metric_definitions` declares each
-- metric as a combination of named source fields (computed generically from
-- the contract schema by frontend/lib/metrics) + a threshold/direction. Adding
-- or tuning a KPI for any business is an insert/update here — no code change.
--
-- `product_kpi_thresholds` (RUN-9) lets a business override a metric's default
-- threshold for a specific product; the global default lives on the definition.
-- =============================================================

-- ---- metric_definitions (the config) -------------------------
-- A metric = operation(numerator_source.field [, denominator_source.field]).
-- (source, field) maps to the column `<source>_<field>` returned by the
-- product_source_facts() function (migration 004). Available facts:
--   sales(revenue, units) · refunds(amount, count) ·
--   ads(spend, revenue) · support(count)
create table if not exists metric_definitions (
  id                  uuid primary key default gen_random_uuid(),
  metric_key          text not null unique,
  display_name        text not null,
  description         text,
  unit                text not null default 'ratio',   -- ratio | currency | count | percentage
  numerator_source    text not null,                   -- sales | refunds | ads | support
  numerator_field     text not null,
  denominator_source  text,                             -- null for raw value metrics
  denominator_field   text,
  operation           text not null default 'ratio'
                        check (operation in ('ratio', 'value')),
  window_days         integer not null default 30,
  direction           text not null
                        check (direction in ('above', 'below')),  -- breach side
  default_threshold   numeric not null,
  severity            text not null default 'medium',   -- critical | high | medium | low
  enabled             boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);

-- ---- product_kpi_thresholds (RUN-9: per-product override) -----
create table if not exists product_kpi_thresholds (
  id           uuid primary key default gen_random_uuid(),
  product_id   text references products(product_id),
  metric_key   text not null references metric_definitions(metric_key),
  threshold    numeric not null,
  direction    text check (direction in ('above', 'below')),  -- null = inherit definition
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (product_id, metric_key)
);

create index if not exists idx_product_kpi_thresholds_lookup
  on product_kpi_thresholds (product_id, metric_key);

-- ---- seed the default metric set (config, swappable) ---------
insert into metric_definitions
  (metric_key, display_name, description, unit, numerator_source, numerator_field,
   denominator_source, denominator_field, operation, window_days, direction,
   default_threshold, severity, sort_order)
values
  ('refund_rate', 'Refund rate',
   'Refunded value as a share of revenue', 'ratio',
   'refunds', 'amount', 'sales', 'revenue', 'ratio', 30, 'above', 0.10, 'high', 1),
  ('return_rate', 'Return rate',
   'Refunded units as a share of units sold', 'ratio',
   'refunds', 'count', 'sales', 'units', 'ratio', 30, 'above', 0.12, 'high', 2),
  ('ad_roas', 'Ad ROAS',
   'Ad-attributed revenue per pound of ad spend', 'ratio',
   'ads', 'revenue', 'ads', 'spend', 'ratio', 30, 'below', 3.0, 'medium', 3),
  ('support_volume', 'Support volume',
   'Support tickets referencing the product', 'count',
   'support', 'count', null, null, 'value', 30, 'above', 50, 'medium', 4)
on conflict (metric_key) do update set
  display_name       = excluded.display_name,
  description        = excluded.description,
  unit               = excluded.unit,
  numerator_source   = excluded.numerator_source,
  numerator_field    = excluded.numerator_field,
  denominator_source = excluded.denominator_source,
  denominator_field  = excluded.denominator_field,
  operation          = excluded.operation,
  window_days        = excluded.window_days,
  direction          = excluded.direction,
  default_threshold  = excluded.default_threshold,
  severity           = excluded.severity,
  sort_order         = excluded.sort_order;
