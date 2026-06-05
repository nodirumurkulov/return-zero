-- =============================================================
-- 020_stage_future_stream.sql  (RUN-109 — complete staging pipeline)
-- Split uploaded/seeded live data at the history cutoff: rows dated
-- after p_cutoff move into *_stream staging tables and are removed from
-- live. Static tables (customers, products, …) stay in live so ingest_stream
-- can satisfy orders_customer_id_fkey when replay advances.
-- =============================================================

-- ---- stage_future_stream(cutoff): live history ≤ cutoff; future → staging ---
create or replace function stage_future_stream(p_cutoff date default date '2025-11-30')
returns void
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from orders o
    left join customers c on c.customer_id = o.customer_id
    where o.created_at::date > p_cutoff
      and o.customer_id is not null
      and c.customer_id is null
  ) then
    raise exception 'stage_future_stream: staged orders reference missing customers — upload customers.csv first';
  end if;

  truncate table
    line_items_stream,
    orders_stream,
    refunds_stream,
    inventory_movements_stream,
    meta_ads_daily_stream,
    google_ads_daily_stream;

  insert into orders_stream
    select * from orders where created_at::date > p_cutoff;

  insert into line_items_stream
    select li.*
    from line_items li
    where li.order_id in (select order_id from orders where created_at::date > p_cutoff);

  insert into refunds_stream
    select * from refunds where created_at::date > p_cutoff;

  insert into inventory_movements_stream
    select * from inventory_movements where date > p_cutoff;

  insert into meta_ads_daily_stream
    select * from meta_ads_daily where date > p_cutoff;

  insert into google_ads_daily_stream
    select * from google_ads_daily where date > p_cutoff;

  delete from line_items
    where order_id in (select order_id from orders where created_at::date > p_cutoff);

  delete from orders where created_at::date > p_cutoff;
  delete from refunds where created_at::date > p_cutoff;
  delete from inventory_movements where date > p_cutoff;
  delete from meta_ads_daily where date > p_cutoff;
  delete from google_ads_daily where date > p_cutoff;
end;
$$;

-- ---- ingest_stream(asof): preflight customer FK, then move staging → live ------
create or replace function ingest_stream(p_asof date)
returns void
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from orders_stream os
    left join customers c on c.customer_id = os.customer_id
    where os.created_at::date <= p_asof
      and os.customer_id is not null
      and c.customer_id is null
  ) then
    raise exception 'ingest_stream: missing customers for staged orders — re-upload customers.csv and re-run learn';
  end if;

  insert into orders
    select * from orders_stream
    where created_at::date <= p_asof
    on conflict (order_id) do nothing;

  insert into line_items
    select li.*
    from line_items_stream li
    where li.order_id in (select order_id from orders)
    on conflict (line_item_id) do nothing;

  insert into refunds
    select * from refunds_stream
    where created_at::date <= p_asof
    on conflict (refund_id) do nothing;

  insert into inventory_movements
    select * from inventory_movements_stream
    where date <= p_asof
    on conflict (movement_id) do nothing;

  insert into meta_ads_daily
    select * from meta_ads_daily_stream
    where date <= p_asof
    on conflict (id) do nothing;

  insert into google_ads_daily
    select * from google_ads_daily_stream
    where date <= p_asof
    on conflict (id) do nothing;
end;
$$;
