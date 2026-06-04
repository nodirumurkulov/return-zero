-- =============================================================
-- 013_replay.sql  (RUN-82 — BYOD Phase 3: real-time detection via replay clock)
--
-- Follow the uploaded orders as if they were arriving in real time: advance a
-- cursor through history and, at each step, detect breaches *as of* that cursor
-- against the learned baseline (migration 012) — the "alert before the loss"
-- moment, streaming new incidents onto the Kanban.
--
--   * product_source_facts gains `p_asof` so the rolling window anchors to the
--     cursor instead of max(created_at) (mirrors product_daily_outflow's p_asof).
--   * replay_state — a singleton holding the current replay cursor, seeded at
--     BASELINE_END (2025-12-01) so the replay streams the post-baseline window.
-- =============================================================

-- ---- product_source_facts(window_days, asof) -----------------------------
-- KPI-neutral source layer, now anchorable to an as-of cursor. When p_asof is
-- null it behaves exactly as before (anchored to the latest order).
create or replace function product_source_facts(p_window_days int default 30, p_asof date default null)
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
    select hi, (hi - make_interval(days => p_window_days)) as lo
    from (
      select coalesce(p_asof::timestamptz + interval '1 day', max(created_at)) as hi
      from orders
    ) anchor
  ),
  sales as (
    select li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as revenue,
           sum(li.quantity)                                             as units
    from line_items li
    join orders o on o.order_id = li.order_id, win
    where o.created_at > win.lo and o.created_at <= win.hi
    group by li.product_id
  ),
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
    join paid p                 on p.campaign_name = cpr.campaign_name
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

-- ---- replay_state (singleton cursor) -------------------------------------
create table if not exists replay_state (
  id      boolean primary key default true,
  cursor  date,
  constraint replay_state_singleton check (id)
);

insert into replay_state (id, cursor)
values (true, date '2025-12-01')
on conflict (id) do nothing;

alter table replay_state enable row level security;

drop policy if exists replay_state_read on replay_state;
create policy replay_state_read on replay_state
  for select to authenticated using (true);
