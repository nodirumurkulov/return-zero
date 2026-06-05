-- =============================================================
-- 018_stream_ingest.sql  (RUN-109 — real-time ingest)
-- The client uploads their HISTORY (≤ the cutoff) into the live tables; the
-- FUTURE rows live in *_stream staging tables. The replay clock starts at the
-- history end and walks forward, ingesting each day's staging rows into the live
-- tables (orders genuinely "arrive") before detection runs — so incidents emerge
-- from newly-arrived data, in date order.
--
-- Only the time-varying tables are staged (orders, line_items, refunds,
-- inventory_movements, ads). Static catalog/cost tables come from the upload.
--
-- NOTE: renumbered from 017 (017 is taken by 017_ads_daily_unique_keys on main).
-- schema_migrations requires unique version prefixes.
-- =============================================================

-- ---- staging tables: exact mirrors of the live ones (PK + defaults, no FKs) --
create table if not exists orders_stream (like orders including all);
create table if not exists line_items_stream (like line_items including all);
create table if not exists refunds_stream (like refunds including all);
create table if not exists inventory_movements_stream (like inventory_movements including all);
create table if not exists meta_ads_daily_stream (like meta_ads_daily including all);
create table if not exists google_ads_daily_stream (like google_ads_daily including all);

-- The fixed start of the live window (history end), set once after learning.
alter table replay_state add column if not exists stream_start date;

-- ---- stream_end_date(): the last day there is anything to stream ------------
create or replace function stream_end_date()
returns date
language sql
stable
set search_path = public
as $$
  select greatest(
    (select max(created_at)::date from orders_stream),
    (select max(date) from inventory_movements_stream)
  );
$$;

-- ---- ingest_stream(asof): move staging rows dated <= asof into the live
-- tables. Idempotent — PKs are preserved so re-runs no-op (on conflict).
-- Ads ids are random uuids (gen_random_uuid), so on conflict (id) never fires
-- spuriously; staging future rows insert cleanly alongside the live history. ---
create or replace function ingest_stream(p_asof date)
returns void
language sql
set search_path = public
as $$
  insert into orders            select * from orders_stream            where created_at::date <= p_asof on conflict (order_id) do nothing;
  insert into line_items        select li.* from line_items_stream li  where li.order_id in (select order_id from orders) on conflict (line_item_id) do nothing;
  insert into refunds           select * from refunds_stream           where created_at::date <= p_asof on conflict (refund_id) do nothing;
  insert into inventory_movements select * from inventory_movements_stream where date <= p_asof on conflict (movement_id) do nothing;
  insert into meta_ads_daily    select * from meta_ads_daily_stream    where date <= p_asof on conflict (id) do nothing;
  insert into google_ads_daily  select * from google_ads_daily_stream  where date <= p_asof on conflict (id) do nothing;
$$;

-- ---- reset_stream(stream_start): rewind to the history end — remove ingested
-- future rows + the incidents that were opened during the stream. ------------
create or replace function reset_stream(p_stream_start date)
returns void
language sql
set search_path = public
as $$
  delete from line_items where order_id in (select order_id from orders where created_at::date > p_stream_start);
  delete from orders              where created_at::date > p_stream_start;
  delete from refunds             where created_at::date > p_stream_start;
  delete from inventory_movements where date > p_stream_start;
  delete from meta_ads_daily       where date > p_stream_start;
  delete from google_ads_daily     where date > p_stream_start;
  truncate table incident_actions, incident_timeline, agent_findings, incidents restart identity cascade;
$$;
