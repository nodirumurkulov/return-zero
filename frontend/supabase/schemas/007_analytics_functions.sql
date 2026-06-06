-- =============================================================
-- 006_analytics_functions.sql
-- Store-scoped KPI-neutral analytics RPCs.
-- =============================================================

create or replace function public.product_source_facts(
  p_store_id uuid,
  p_window_days int default 30,
  p_asof date default null
)
returns table (
  product_id      uuid,
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
    select hi, (hi - make_interval(days => p_window_days)) as lo
    from (
      select coalesce(
        p_asof::timestamptz + interval '1 day',
        max(o.created_at)
      ) as hi
      from public.orders o
      where o.store_id = p_store_id
    ) anchor
  ),
  sales as (
    select li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as revenue,
           sum(li.quantity)                                             as units
    from public.line_items li
    join public.orders o on o.id = li.order_id, win
    where o.store_id = p_store_id
      and li.store_id = p_store_id
      and o.created_at > win.lo and o.created_at <= win.hi
    group by li.product_id
  ),
  refund_exploded as (
    select v.product_id,
           r.amount / nullif(jsonb_array_length(r.refund_line_items), 0) as amt_alloc
    from public.refunds r, win
    cross join lateral jsonb_array_elements_text(r.refund_line_items) as elem(variant_external_id)
    join public.variants v
      on v.external_id = elem.variant_external_id
     and v.store_id = p_store_id
    where r.store_id = p_store_id
      and r.created_at > win.lo and r.created_at <= win.hi
  ),
  refunds_agg as (
    select product_id, sum(amt_alloc) as amount, count(*)::numeric as cnt
    from refund_exploded
    group by product_id
  ),
  paid as (
    select campaign_name, sum(spend_gbp) as spend
    from (
      select campaign_name, date, spend_gbp
      from public.google_ads_daily
      where store_id = p_store_id
      union all
      select campaign_name, date, spend_gbp
      from public.meta_ads_daily
      where store_id = p_store_id
    ) a, win
    where a.date > win.lo::date and a.date <= win.hi::date
    group by campaign_name
  ),
  campaign_product_rev as (
    select o.utm_campaign as campaign_name, li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as rev
    from public.orders o
    join public.line_items li on li.order_id = o.id, win
    where o.store_id = p_store_id
      and li.store_id = p_store_id
      and o.created_at > win.lo and o.created_at <= win.hi
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
    join paid p on p.campaign_name = cpr.campaign_name
    join campaign_total_rev ctr on ctr.campaign_name = cpr.campaign_name
    group by cpr.product_id
  ),
  support_agg as (
    select related_product_id as product_id, count(*)::numeric as cnt
    from public.support_tickets, win
    where store_id = p_store_id
      and created_at > win.lo and created_at <= win.hi
      and related_product_id is not null
    group by related_product_id
  )
  select p.id,
         coalesce(s.revenue, 0),
         coalesce(s.units, 0),
         coalesce(r.amount, 0),
         coalesce(r.cnt, 0),
         coalesce(a.spend, 0),
         coalesce(a.revenue, 0),
         coalesce(t.cnt, 0)
  from public.products p
  left join sales s on s.product_id = p.id
  left join refunds_agg r on r.product_id = p.id
  left join ads_agg a on a.product_id = p.id
  left join support_agg t on t.product_id = p.id
  where p.store_id = p_store_id;
$$;

create or replace function public.product_monthly_series(
  p_store_id uuid,
  p_months int default 24
)
returns table (
  product_id      uuid,
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
set search_path = public
as $$
  with bounds as (
    select date_trunc('month', max(created_at))::date as last_month
    from public.orders
    where store_id = p_store_id
  ),
  lo as (
    select (last_month - make_interval(months => p_months - 1))::date as from_month
    from bounds
  ),
  months as (
    select generate_series(
      (select from_month from lo),
      (select last_month from bounds),
      interval '1 month'
    )::date as month
  ),
  spine as (
    select p.id as product_id, m.month
    from public.products p
    cross join months m
    where p.store_id = p_store_id
  ),
  sales as (
    select li.product_id, date_trunc('month', o.created_at)::date as month,
           sum(li.quantity) as units,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as revenue
    from public.line_items li
    join public.orders o on o.id = li.order_id
    where o.store_id = p_store_id
      and li.store_id = p_store_id
      and o.created_at >= (select from_month from lo)
    group by 1, 2
  ),
  refunds_m as (
    select v.product_id, date_trunc('month', r.created_at)::date as month,
           sum(r.amount / nullif(jsonb_array_length(r.refund_line_items), 0)) as amount,
           count(*)::numeric as cnt
    from public.refunds r
    cross join lateral jsonb_array_elements_text(r.refund_line_items) as elem(variant_external_id)
    join public.variants v
      on v.external_id = elem.variant_external_id
     and v.store_id = p_store_id
    where r.store_id = p_store_id
      and r.created_at >= (select from_month from lo)
    group by 1, 2
  ),
  paid_m as (
    select campaign_name, date_trunc('month', date)::date as month, sum(spend_gbp) as spend
    from (
      select campaign_name, date, spend_gbp
      from public.google_ads_daily
      where store_id = p_store_id
      union all
      select campaign_name, date, spend_gbp
      from public.meta_ads_daily
      where store_id = p_store_id
    ) a
    where a.date >= (select from_month from lo)
    group by 1, 2
  ),
  cpr_m as (
    select o.utm_campaign as campaign_name,
           date_trunc('month', o.created_at)::date as month,
           li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as rev
    from public.orders o
    join public.line_items li on li.order_id = o.id
    where o.store_id = p_store_id
      and li.store_id = p_store_id
      and o.utm_campaign is not null
      and o.created_at >= (select from_month from lo)
    group by 1, 2, 3
  ),
  ctr_m as (
    select campaign_name, month, sum(rev) as total
    from cpr_m
    group by 1, 2
  ),
  ads_m as (
    select cpr.product_id, cpr.month,
           sum(p.spend * cpr.rev / nullif(ctr.total, 0)) as spend,
           sum(cpr.rev) as revenue
    from cpr_m cpr
    join paid_m p on p.campaign_name = cpr.campaign_name and p.month = cpr.month
    join ctr_m ctr on ctr.campaign_name = cpr.campaign_name and ctr.month = cpr.month
    group by 1, 2
  )
  select s.product_id, s.month,
         coalesce(sl.units, 0), coalesce(sl.revenue, 0),
         coalesce(rf.amount, 0), coalesce(rf.cnt, 0),
         coalesce(ad.spend, 0), coalesce(ad.revenue, 0)
  from spine s
  left join sales sl on sl.product_id = s.product_id and sl.month = s.month
  left join refunds_m rf on rf.product_id = s.product_id and rf.month = s.month
  left join ads_m ad on ad.product_id = s.product_id and ad.month = s.month
  order by s.product_id, s.month;
$$;

create or replace function public.product_daily_outflow(
  p_store_id uuid,
  p_days int default 28,
  p_asof date default null
)
returns table (
  product_id      uuid,
  daily_outflow   numeric,
  current_balance numeric
)
language sql
stable
set search_path = public
as $$
  with asof as (
    select coalesce(
      p_asof,
      (select max(date) from public.inventory_movements where store_id = p_store_id)
    ) as d
  ),
  recent as (
    select v.product_id,
           sum(case when im.quantity_delta < 0 then -im.quantity_delta else 0 end)::numeric
             / nullif(p_days, 0) as daily_outflow
    from public.inventory_movements im
    join public.variants v on v.id = im.variant_id, asof
    where im.store_id = p_store_id
      and v.store_id = p_store_id
      and im.date > asof.d - p_days and im.date <= asof.d
    group by v.product_id
  ),
  bal as (
    select v.product_id, sum(lb.running_balance) as current_balance
    from public.variants v
    join lateral (
      select im2.running_balance
      from public.inventory_movements im2, asof
      where im2.variant_id = v.id
        and im2.store_id = p_store_id
        and im2.date <= asof.d
      order by im2.date desc
      limit 1
    ) lb on true
    where v.store_id = p_store_id
    group by v.product_id
  )
  select p.id, coalesce(r.daily_outflow, 0), coalesce(b.current_balance, 0)
  from public.products p
  left join recent r on r.product_id = p.id
  left join bal b on b.product_id = p.id
  where p.store_id = p_store_id;
$$;
