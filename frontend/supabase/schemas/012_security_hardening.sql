-- =============================================================
-- 010_security_hardening.sql
-- RPC least-privilege, support_tickets composite FKs, force RLS.
-- =============================================================

-- ---- RPC grants: destructive fn service-role only ----------------
revoke all on function public.reset_store_data(uuid) from public;
revoke all on function public.reset_store_data(uuid) from anon, authenticated;
grant execute on function public.reset_store_data(uuid) to service_role;

revoke all on function public.product_source_facts(uuid, integer, date) from public;
revoke all on function public.product_source_facts(uuid, integer, date) from anon;
grant execute on function public.product_source_facts(uuid, integer, date) to authenticated, service_role;

revoke all on function public.product_monthly_series(uuid, integer) from public;
revoke all on function public.product_monthly_series(uuid, integer) from anon;
grant execute on function public.product_monthly_series(uuid, integer) to authenticated, service_role;

revoke all on function public.product_daily_outflow(uuid, integer, date) from public;
revoke all on function public.product_daily_outflow(uuid, integer, date) from anon;
grant execute on function public.product_daily_outflow(uuid, integer, date) to authenticated, service_role;

-- ---- support_tickets composite FKs -----------------------------
alter table public.support_tickets drop constraint if exists support_tickets_customer_id_fkey;
alter table public.support_tickets drop constraint if exists support_tickets_related_order_id_fkey;
alter table public.support_tickets drop constraint if exists support_tickets_related_product_id_fkey;

alter table public.support_tickets
  add constraint support_tickets_customer_org_fkey
  foreign key (organization_id, customer_id)
  references public.customers (organization_id, id)
  on delete set null;

alter table public.support_tickets
  add constraint support_tickets_related_order_org_fkey
  foreign key (organization_id, related_order_id)
  references public.orders (organization_id, id)
  on delete set null;

alter table public.support_tickets
  add constraint support_tickets_related_product_org_fkey
  foreign key (organization_id, related_product_id)
  references public.products (organization_id, id)
  on delete set null;

-- ---- force RLS (defense in depth) ------------------------------
do $$
declare
  t text;
  tenant_tables text[] := array[
    'organizations', 'organization_members',
    'collections', 'products', 'variants', 'customers', 'orders', 'line_items',
    'refunds', 'meta_ads_daily', 'google_ads_daily', 'inventory_movements',
    'support_tickets', 'purchase_orders', 'po_line_items',
    'suppliers', 'product_collections', 'addresses', 'discount_codes',
    'email_campaigns', 'email_events', 'support_messages', 'bank_transactions',
    'metric_definitions', 'product_kpi_thresholds', 'product_baselines',
    'forecast_rules', 'business_settings', 'business_reports', 'store_connections',
    'incidents', 'agent_findings', 'incident_actions', 'incident_timeline',
    'investigation_steps'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;
