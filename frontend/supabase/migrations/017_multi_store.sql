-- =============================================================
-- 017_multi_store.sql
-- Multi-store: store_connections PK, store_id on contract data,
-- active_store_id on organizations, reset_store_data.
-- =============================================================

-- ---- enum: importing → syncing --------------------------------
alter type public.store_connection_status rename value 'importing' to 'syncing';

-- ---- store_connections: id PK, label, sync_error ------------
alter table public.store_connections
  add column id uuid default gen_random_uuid();

update public.store_connections
set id = gen_random_uuid()
where id is null;

alter table public.store_connections
  alter column id set not null;

alter table public.store_connections
  drop constraint store_connections_pkey;

alter table public.store_connections
  add primary key (id);

alter table public.store_connections
  add constraint store_connections_org_id_unique unique (organization_id, id);

alter table public.store_connections
  add column label text,
  add column sync_error text;

create unique index store_connections_one_mock_per_org
  on public.store_connections (organization_id)
  where platform = 'mock_csv';

create unique index store_connections_shopify_shop_per_org
  on public.store_connections (organization_id, external_shop_id)
  where platform = 'shopify' and external_shop_id is not null;

create index idx_store_connections_organization_id
  on public.store_connections (organization_id);

-- ---- organizations.active_store_id ---------------------------
alter table public.organizations
  add column active_store_id uuid references public.store_connections (id) on delete set null;

update public.organizations o
set active_store_id = sc.id
from public.store_connections sc
where sc.organization_id = o.id;

-- ---- store_id on contract + incident tables ------------------
do $$
declare
  t text;
  tables text[] := array[
    'collections', 'products', 'variants', 'customers', 'orders', 'line_items',
    'refunds', 'meta_ads_daily', 'google_ads_daily', 'inventory_movements',
    'support_tickets', 'purchase_orders', 'po_line_items', 'suppliers',
    'product_collections', 'addresses', 'discount_codes', 'email_campaigns',
    'email_events', 'support_messages', 'bank_transactions', 'incidents'
  ];
begin
  foreach t in array tables loop
    execute format(
      'alter table public.%I add column store_id uuid',
      t
    );
    execute format(
      $u$
        update public.%I tbl
        set store_id = sc.id
        from public.store_connections sc
        where sc.organization_id = tbl.organization_id
      $u$,
      t
    );
    execute format(
      'alter table public.%I alter column store_id set not null',
      t
    );
    execute format(
      $f$
        alter table public.%I
          add constraint %I
          foreign key (store_id) references public.store_connections (id) on delete cascade
      $f$,
      t,
      t || '_store_id_fkey'
    );
    execute format(
      'create index %I on public.%I (store_id)',
      'idx_' || t || '_store_id',
      t
    );
  end loop;
end $$;

-- ---- reset_store_data (replaces reset_organization_data) -----
create or replace function public.reset_store_data(p_store_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.incident_actions
  where incident_id in (
    select id from public.incidents where store_id = p_store_id
  );
  delete from public.incident_timeline
  where incident_id in (
    select id from public.incidents where store_id = p_store_id
  );
  delete from public.agent_findings
  where incident_id in (
    select id from public.incidents where store_id = p_store_id
  );
  delete from public.incidents where store_id = p_store_id;

  delete from public.support_messages where store_id = p_store_id;
  delete from public.email_events where store_id = p_store_id;
  delete from public.product_collections where store_id = p_store_id;
  delete from public.addresses where store_id = p_store_id;
  delete from public.discount_codes where store_id = p_store_id;
  delete from public.suppliers where store_id = p_store_id;
  delete from public.bank_transactions where store_id = p_store_id;
  delete from public.email_campaigns where store_id = p_store_id;

  update public.store_connections
  set
    replay_cursor = date '2025-12-01',
    status = 'pending',
    last_synced_at = null,
    sync_error = null,
    updated_at = now()
  where id = p_store_id;

  delete from public.line_items where store_id = p_store_id;
  delete from public.refunds where store_id = p_store_id;
  delete from public.po_line_items where store_id = p_store_id;
  delete from public.inventory_movements where store_id = p_store_id;
  delete from public.support_tickets where store_id = p_store_id;
  delete from public.orders where store_id = p_store_id;
  delete from public.variants where store_id = p_store_id;
  delete from public.purchase_orders where store_id = p_store_id;
  delete from public.products where store_id = p_store_id;
  delete from public.collections where store_id = p_store_id;
  delete from public.customers where store_id = p_store_id;
  delete from public.google_ads_daily where store_id = p_store_id;
  delete from public.meta_ads_daily where store_id = p_store_id;
end;
$$;

drop function if exists public.reset_organization_data(uuid);

revoke all on function public.reset_store_data(uuid) from public;
revoke all on function public.reset_store_data(uuid) from anon, authenticated;
grant execute on function public.reset_store_data(uuid) to service_role;

-- ---- seed_organization_defaults: multi-store mock insert -----
create or replace function public.seed_organization_defaults(p_organization_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.metric_definitions (
    organization_id, metric_key, display_name, description, unit,
    numerator_source, numerator_field, denominator_source, denominator_field,
    operation, window_days, direction, default_threshold, severity, sort_order,
    impact_source, impact_field, impact_label
  ) values
    (p_organization_id, 'refund_rate', 'Refund rate',
     'Refunded value as a share of revenue', 'ratio',
     'refunds', 'amount', 'sales', 'revenue', 'ratio', 30, 'above', 0.10, 'high', 1,
     'refunds', 'amount', 'refund exposure'),
    (p_organization_id, 'return_rate', 'Return rate',
     'Refunded units as a share of units sold', 'ratio',
     'refunds', 'count', 'sales', 'units', 'ratio', 30, 'above', 0.12, 'high', 2,
     'refunds', 'amount', 'return exposure'),
    (p_organization_id, 'ad_roas', 'Ad ROAS',
     'Ad-attributed revenue per pound of ad spend', 'ratio',
     'ads', 'revenue', 'ads', 'spend', 'ratio', 30, 'below', 1.5, 'medium', 3,
     'ads', 'spend', 'ad spend at risk'),
    (p_organization_id, 'support_volume', 'Support volume',
     'Support tickets referencing the product', 'count',
     'support', 'count', null, null, 'value', 30, 'above', 50, 'medium', 4,
     'support', 'count', 'support tickets');

  insert into public.business_settings (organization_id, key, value, label) values
    (p_organization_id, 'lead_time_days', 71, 'Supplier lead time (days)'),
    (p_organization_id, 'buffer_days', 14, 'Safety buffer (days)'),
    (p_organization_id, 'target_margin', 0.55, 'Target gross margin'),
    (p_organization_id, 'min_roas', 3.0, 'Minimum acceptable ROAS'),
    (p_organization_id, 'recovery_horizon_days', 21, 'Projected recovery horizon (days)');

  insert into public.forecast_rules (
    organization_id, rule_key, kind, horizon_days, threshold, severity
  ) values
    (p_organization_id, 'stockout_lead', 'stockout', 85, 85, 'high'),
    (p_organization_id, 'refund_trend_up', 'refund_trend', 30, 0.15, 'high'),
    (p_organization_id, 'roas_decay_down', 'roas_decay', 30, 1.5, 'medium'),
    (p_organization_id, 'revenue_drop', 'revenue_drop', 90, 0.20, 'medium');

  insert into public.store_connections (
    organization_id, platform, sync_mode, status, replay_cursor
  ) values (
    p_organization_id, 'mock_csv', 'static', 'pending', date '2025-12-01'
  )
  on conflict (organization_id) where (platform = 'mock_csv') do nothing;

  update public.organizations
  set active_store_id = (
    select sc.id
    from public.store_connections sc
    where sc.organization_id = p_organization_id
      and sc.platform = 'mock_csv'
    limit 1
  )
  where id = p_organization_id;
end;
$$;
