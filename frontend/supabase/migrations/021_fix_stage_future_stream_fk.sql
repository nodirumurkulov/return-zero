-- =============================================================
-- 021_fix_stage_future_stream_fk.sql
-- Fix FK violation in stage_future_stream: it deleted `orders` before
-- `refunds`, so a future order whose refund is still live tripped
-- refunds_order_id_fkey ("update or delete on table orders violates foreign
-- key constraint refunds_order_id_fkey"). Refunds are children of orders
-- (refunds.order_id -> orders.order_id), so they must be deleted with
-- line_items, BEFORE the parent orders. Inserts/staging are unchanged.
-- =============================================================

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

  -- Delete children (line_items, refunds) before the parent orders so the
  -- refunds_order_id_fkey constraint is never violated mid-statement.
  delete from line_items
    where order_id in (select order_id from orders where created_at::date > p_cutoff);
  delete from refunds where created_at::date > p_cutoff;

  delete from orders where created_at::date > p_cutoff;
  delete from inventory_movements where date > p_cutoff;
  delete from meta_ads_daily where date > p_cutoff;
  delete from google_ads_daily where date > p_cutoff;
end;
$$;
