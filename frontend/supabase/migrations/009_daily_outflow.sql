-- =============================================================
-- 009_daily_outflow.sql  (RUN-65 support)
-- product_daily_outflow(days, as_of) — recent inventory burn rate + current
-- stock per product, the real signal for stockout forecasting.
--
-- Monthly demand trend fails for newly-launched SKUs (no history); recent
-- outflow from inventory_movements captures the actual sell-through, including
-- a launch surge. The optional `as_of` cursor lets us replay history (e.g.
-- forecast the 2025-12-14 cap stockout as of 2025-12-07).
-- =============================================================

create or replace function product_daily_outflow(p_days int default 28, p_asof date default null)
returns table (
  product_id      text,
  daily_outflow   numeric,  -- avg units sold/day over the window
  current_balance numeric   -- summed latest running_balance as of the cursor
)
language sql
stable
set search_path = public
as $$
  with asof as (
    select coalesce(p_asof, (select max(date) from inventory_movements)) as d
  ),
  recent as (
    select v.product_id,
           sum(case when im.quantity_delta < 0 then -im.quantity_delta else 0 end)::numeric
             / nullif(p_days, 0) as daily_outflow
    from inventory_movements im
    join variants v on v.variant_id = im.variant_id, asof
    where im.date > asof.d - p_days and im.date <= asof.d
    group by v.product_id
  ),
  bal as (
    select v.product_id, sum(lb.running_balance) as current_balance
    from variants v
    join lateral (
      select im2.running_balance
      from inventory_movements im2, asof
      where im2.variant_id = v.variant_id and im2.date <= asof.d
      order by im2.date desc
      limit 1
    ) lb on true
    group by v.product_id
  )
  select p.product_id, coalesce(r.daily_outflow, 0), coalesce(b.current_balance, 0)
  from products p
  left join recent r on r.product_id = p.product_id
  left join bal b    on b.product_id = p.product_id;
$$;
