-- =============================================================
-- 003_product_metrics.sql
-- KPI thresholds + product metric views for catalog UI
-- =============================================================

create table if not exists product_kpi_thresholds (
  id              uuid primary key default uuid_generate_v4(),
  product_id      text not null references products(product_id) on delete cascade,
  kpi_name        text not null,
  warning_value   numeric not null,
  critical_value  numeric not null,
  direction       text not null default 'above',
  updated_at      timestamptz not null default now(),
  unique (product_id, kpi_name)
);

create index if not exists idx_kpi_thresholds_product on product_kpi_thresholds(product_id);

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

-- Default thresholds for demo hero SKU
insert into product_kpi_thresholds (product_id, kpi_name, warning_value, critical_value, direction)
values
  ('prod_00005', 'return_rate', 0.15, 0.20, 'above'),
  ('prod_00005', 'refund_rate', 0.10, 0.15, 'above'),
  ('prod_00005', 'support_tickets', 15, 25, 'above')
on conflict (product_id, kpi_name) do nothing;

-- Global defaults for other products
insert into product_kpi_thresholds (product_id, kpi_name, warning_value, critical_value, direction)
select
  p.product_id,
  k.kpi_name,
  k.warning_value,
  k.critical_value,
  k.direction
from products p
cross join (
  values
    ('return_rate', 0.12, 0.18, 'above'),
    ('refund_rate', 0.08, 0.12, 'above'),
    ('support_tickets', 10, 20, 'above')
) as k(kpi_name, warning_value, critical_value, direction)
where p.product_id <> 'prod_00005'
on conflict (product_id, kpi_name) do nothing;
