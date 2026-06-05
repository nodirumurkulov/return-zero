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
-- 30-day aggregates per product
create or replace view product_metrics_view as
with window_orders as (
  select o.order_id, o.created_at
  from orders o
  where o.created_at >= now() - interval '30 days'
    and o.financial_status in ('paid', 'partially_refunded', 'refunded')
),
product_order_stats as (
  select
    li.product_id,
    count(distinct li.order_id)::numeric as order_count,
    coalesce(sum(li.quantity * li.price), 0)::numeric as revenue_gbp
  from line_items li
  join window_orders wo on wo.order_id = li.order_id
  group by li.product_id
),
product_refund_stats as (
  select
    li.product_id,
    count(distinct r.refund_id)::numeric as refund_count,
    coalesce(sum(r.amount), 0)::numeric as refund_gbp
  from refunds r
  join orders o on o.order_id = r.order_id
  join line_items li on li.order_id = r.order_id
  where r.created_at >= now() - interval '30 days'
  group by li.product_id
),
product_support_stats as (
  select
    st.related_product_id as product_id,
    count(*)::numeric as support_tickets
  from support_tickets st
  where st.created_at >= now() - interval '30 days'
    and st.related_product_id is not null
  group by st.related_product_id
),
product_ad_stats as (
  select
    p.product_id,
    case
      when sum(g.spend_gbp) > 0
      then sum(g.conversion_value_gbp) / nullif(sum(g.spend_gbp), 0)
      else null
    end as ad_roas
  from products p
  left join orders o
    on o.utm_campaign is not null
   and o.created_at >= now() - interval '30 days'
  left join line_items li on li.order_id = o.order_id and li.product_id = p.product_id
  left join google_ads_daily g
    on g.campaign_name = o.utm_campaign
   and g.date >= (current_date - interval '30 days')
  group by p.product_id
)
select
  p.product_id,
  p.title,
  p.product_type,
  p.gender_segment,
  coalesce(pos.revenue_gbp, 0) as revenue_gbp,
  coalesce(pos.order_count, 0) as order_count,
  case
    when coalesce(pos.order_count, 0) > 0
    then coalesce(prs.refund_count, 0) / pos.order_count
    else 0
  end as return_rate,
  case
    when coalesce(pos.revenue_gbp, 0) > 0
    then coalesce(prs.refund_gbp, 0) / pos.revenue_gbp
    else 0
  end as refund_rate,
  coalesce(pss.support_tickets, 0) as support_tickets,
  pas.ad_roas
from products p
left join product_order_stats pos on pos.product_id = p.product_id
left join product_refund_stats prs on prs.product_id = p.product_id
left join product_support_stats pss on pss.product_id = p.product_id
left join product_ad_stats pas on pas.product_id = p.product_id;

-- Monthly sparkline data (last 12 months)
create or replace view product_metrics_monthly_view as
with months as (
  select generate_series(
    date_trunc('month', now()) - interval '11 months',
    date_trunc('month', now()),
    interval '1 month'
  )::date as month_start
),
monthly_refunds as (
  select
    li.product_id,
    date_trunc('month', r.created_at)::date as month_start,
    count(distinct r.refund_id)::numeric as refund_count
  from refunds r
  join line_items li on li.order_id = r.order_id
  where r.created_at >= date_trunc('month', now()) - interval '11 months'
  group by li.product_id, date_trunc('month', r.created_at)::date
),
monthly_orders as (
  select
    li.product_id,
    date_trunc('month', o.created_at)::date as month_start,
    count(distinct o.order_id)::numeric as order_count,
    coalesce(sum(li.quantity * li.price), 0)::numeric as revenue_gbp
  from orders o
  join line_items li on li.order_id = o.order_id
  where o.created_at >= date_trunc('month', now()) - interval '11 months'
    and o.financial_status in ('paid', 'partially_refunded', 'refunded')
  group by li.product_id, date_trunc('month', o.created_at)::date
)
select
  p.product_id,
  m.month_start,
  coalesce(mo.revenue_gbp, 0) as revenue_gbp,
  coalesce(mo.order_count, 0) as order_count,
  case
    when coalesce(mo.order_count, 0) > 0
    then coalesce(mr.refund_count, 0) / mo.order_count
    else 0
  end as return_rate
from products p
cross join months m
left join monthly_orders mo
  on mo.product_id = p.product_id and mo.month_start = m.month_start
left join monthly_refunds mr
  on mr.product_id = p.product_id and mr.month_start = m.month_start;

-- Global default thresholds (metric_key from metric_definitions)
insert into product_kpi_thresholds (product_id, metric_key, threshold, direction)
select
  p.product_id,
  k.metric_key,
  k.threshold,
  k.direction
from products p
cross join (
  values
    ('return_rate', 0.12, 'above'),
    ('refund_rate', 0.08, 'above'),
    ('support_volume', 10, 'above')
) as k(metric_key, threshold, direction)
where p.product_id <> 'prod_00005'
on conflict (product_id, metric_key) do nothing;

-- Per-product overrides for demo SKUs are seeded in scripts/seed.ts after products load.
