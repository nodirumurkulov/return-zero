-- =============================================================
-- 004_product_source_facts.sql
-- product_source_facts(window_days) — the generic, KPI-NEUTRAL source layer.
--
-- Returns per-product facts derived from the contract schema. It encodes only
-- structural relationships of the contract (how refunds/ads/tickets attach to a
-- product), NOT any business KPI. The config-driven engine (lib/metrics) combines
-- these facts into KPIs per the metric_definitions rows. The window is anchored to
-- the data's own latest order date, so it adapts to any dataset.
--
-- Column naming is `<source>_<field>` to match metric_definitions(source, field):
--   sales_revenue, sales_units, refunds_amount, refunds_count,
--   ads_spend, ads_revenue, support_count
-- =============================================================

create or replace function product_source_facts(p_window_days int default 30)
returns table (
  product_id      text,
  sales_revenue   numeric,
  sales_units     numeric,
  refunds_amount  numeric,
  refunds_count   numeric,
  ads_spend       numeric,
  ads_revenue     numeric,
  support_count   numeric
)
language sql
stable
set search_path = public
as $$
  with win as (
    select max(created_at) as hi,
           max(created_at) - make_interval(days => p_window_days) as lo
    from orders
  ),
  -- demand
  sales as (
    select li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as revenue,
           sum(li.quantity)                                             as units
    from line_items li
    join orders o on o.order_id = li.order_id, win
    where o.created_at > win.lo and o.created_at <= win.hi
    group by li.product_id
  ),
  -- refunds: unnest refund_line_items (any length) -> variant -> product;
  -- allocate the order-level refund amount evenly across its line items.
  refund_exploded as (
    select v.product_id,
           r.amount / nullif(jsonb_array_length(r.refund_line_items::jsonb), 0) as amt_alloc
    from refunds r, win
    cross join lateral jsonb_array_elements_text(r.refund_line_items::jsonb) as elem(variant_id)
    join variants v on v.variant_id = elem.variant_id
    where r.created_at > win.lo and r.created_at <= win.hi
  ),
  refunds_agg as (
    select product_id, sum(amt_alloc) as amount, count(*) as cnt
    from refund_exploded
    group by product_id
  ),
  -- ad spend/revenue attributed to products via utm_campaign, spend split by
  -- each product's share of that campaign's revenue in the window.
  paid as (
    select campaign_name, sum(spend_gbp) as spend
    from (
      select campaign_name, date, spend_gbp from google_ads_daily
      union all
      select campaign_name, date, spend_gbp from meta_ads_daily
    ) a, win
    where a.date > win.lo::date and a.date <= win.hi::date
    group by campaign_name
  ),
  campaign_product_rev as (
    select o.utm_campaign as campaign_name, li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as rev
    from orders o
    join line_items li on li.order_id = o.order_id, win
    where o.created_at > win.lo and o.created_at <= win.hi
      and o.utm_campaign is not null
    group by o.utm_campaign, li.product_id
  ),
  campaign_total_rev as (
    select campaign_name, sum(rev) as total_rev
    from campaign_product_rev
    group by campaign_name
  ),
  ads_agg as (
    select cpr.product_id,
           sum(p.spend * cpr.rev / nullif(ctr.total_rev, 0)) as spend,
           sum(cpr.rev)                                      as revenue
    from campaign_product_rev cpr
    join paid p              on p.campaign_name = cpr.campaign_name
    join campaign_total_rev ctr on ctr.campaign_name = cpr.campaign_name
    group by cpr.product_id
  ),
  support_agg as (
    select related_product_id as product_id, count(*) as cnt
    from support_tickets, win
    where created_at > win.lo and created_at <= win.hi
      and related_product_id is not null
    group by related_product_id
  )
  select p.product_id,
         coalesce(s.revenue, 0),
         coalesce(s.units, 0),
         coalesce(r.amount, 0),
         coalesce(r.cnt, 0),
         coalesce(a.spend, 0),
         coalesce(a.revenue, 0),
         coalesce(t.cnt, 0)
  from products p
  left join sales s       on s.product_id = p.product_id
  left join refunds_agg r on r.product_id = p.product_id
  left join ads_agg a     on a.product_id = p.product_id
  left join support_agg t on t.product_id = p.product_id;
$$;
