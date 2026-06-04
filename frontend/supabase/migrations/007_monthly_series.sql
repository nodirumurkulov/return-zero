-- =============================================================
-- 007_monthly_series.sql  (RUN-11)
-- product_monthly_series(months) — per-product monthly time series.
--
-- The monthly twin of product_source_facts(): one row per product per month,
-- zero-filled across a complete spine so every product has an unbroken series.
-- Powers catalog sparklines AND the forecasting engine. KPI-neutral, generic.
-- Columns: units, revenue, refund_amount, refund_count, ad_spend, ad_revenue.
-- =============================================================

create or replace function product_monthly_series(p_months int default 24)
returns table (
  product_id      text,
  month           date,
  units           numeric,
  revenue         numeric,
  refund_amount   numeric,
  refund_count    numeric,
  ad_spend        numeric,
  ad_revenue      numeric
)
language sql
stable
as $$
  with bounds as (
    select date_trunc('month', max(created_at))::date as last_month from orders
  ),
  lo as (
    select (last_month - make_interval(months => p_months - 1))::date as from_month from bounds
  ),
  months as (
    select generate_series((select from_month from lo), (select last_month from bounds), interval '1 month')::date as month
  ),
  spine as (
    select p.product_id, m.month from products p cross join months m
  ),
  sales as (
    select li.product_id, date_trunc('month', o.created_at)::date as month,
           sum(li.quantity)                                              as units,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0))  as revenue
    from line_items li
    join orders o on o.order_id = li.order_id
    where o.created_at >= (select from_month from lo)
    group by 1, 2
  ),
  refunds_m as (
    select v.product_id, date_trunc('month', r.created_at)::date as month,
           sum(r.amount / nullif(jsonb_array_length(r.refund_line_items::jsonb), 0)) as amount,
           count(*) as cnt
    from refunds r
    cross join lateral jsonb_array_elements_text(r.refund_line_items::jsonb) as elem(variant_id)
    join variants v on v.variant_id = elem.variant_id
    where r.created_at >= (select from_month from lo)
    group by 1, 2
  ),
  paid_m as (
    select campaign_name, date_trunc('month', date)::date as month, sum(spend_gbp) as spend
    from (
      select campaign_name, date, spend_gbp from google_ads_daily
      union all
      select campaign_name, date, spend_gbp from meta_ads_daily
    ) a
    where a.date >= (select from_month from lo)
    group by 1, 2
  ),
  cpr_m as (
    select o.utm_campaign as campaign_name, date_trunc('month', o.created_at)::date as month, li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as rev
    from orders o
    join line_items li on li.order_id = o.order_id
    where o.utm_campaign is not null and o.created_at >= (select from_month from lo)
    group by 1, 2, 3
  ),
  ctr_m as (
    select campaign_name, month, sum(rev) as total from cpr_m group by 1, 2
  ),
  ads_m as (
    select cpr.product_id, cpr.month,
           sum(p.spend * cpr.rev / nullif(ctr.total, 0)) as spend,
           sum(cpr.rev)                                  as revenue
    from cpr_m cpr
    join paid_m p  on p.campaign_name = cpr.campaign_name and p.month = cpr.month
    join ctr_m ctr on ctr.campaign_name = cpr.campaign_name and ctr.month = cpr.month
    group by 1, 2
  )
  select s.product_id, s.month,
         coalesce(sl.units, 0), coalesce(sl.revenue, 0),
         coalesce(rf.amount, 0), coalesce(rf.cnt, 0),
         coalesce(ad.spend, 0), coalesce(ad.revenue, 0)
  from spine s
  left join sales sl     on sl.product_id = s.product_id and sl.month = s.month
  left join refunds_m rf on rf.product_id = s.product_id and rf.month = s.month
  left join ads_m ad     on ad.product_id = s.product_id and ad.month = s.month
  order by s.product_id, s.month;
$$;
