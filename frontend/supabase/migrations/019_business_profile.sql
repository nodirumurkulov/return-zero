-- =============================================================
-- 019_business_profile.sql  (RUN-111)
-- Store onboarding business profile (string fields) and optional
-- per-product cost overrides. Numeric knobs stay in business_settings.
-- =============================================================

create table if not exists business_profile (
  id             boolean primary key default true check (id = true),
  platform       text not null default 'shopify',
  store_name     text not null default '',
  primary_goal   text not null default 'growth'
    check (primary_goal in ('growth', 'margin', 'cash')),
  hero_product_ids text[] not null default '{}',
  updated_at     timestamptz not null default now()
);

insert into business_profile (id) values (true) on conflict (id) do nothing;

create table if not exists product_cost_overrides (
  product_id     text primary key references products(product_id) on delete cascade,
  cost_per_unit  numeric not null check (cost_per_unit >= 0),
  updated_at     timestamptz not null default now()
);

-- Extend reset so a fresh upload clears profile, cost overrides, and staging.
create or replace function reset_contract_data()
returns void
language sql
set search_path = public
as $$
  truncate table
    product_cost_overrides,
    line_items, refunds, po_line_items, inventory_movements, support_tickets,
    orders, variants, purchase_orders, products, customers, collections,
    meta_ads_daily, google_ads_daily,
    orders_stream, line_items_stream, refunds_stream, inventory_movements_stream,
    meta_ads_daily_stream, google_ads_daily_stream,
    incident_actions, incident_timeline, agent_findings, incidents,
    product_kpi_thresholds, product_baselines, business_reports,
    replay_state
  restart identity cascade;

  delete from business_profile where id = true;
  insert into business_profile (id) values (true) on conflict (id) do nothing;
$$;
