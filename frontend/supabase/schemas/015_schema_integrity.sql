-- =============================================================
-- 015_schema_integrity.sql
-- Composite FK fixes and reset_store_data completeness.
-- =============================================================

-- purchase_orders.supplier_id (text external id) → suppliers(organization_id, external_id)
alter table public.purchase_orders
  add constraint purchase_orders_supplier_org_fkey
  foreign key (organization_id, supplier_id)
  references public.suppliers (organization_id, external_id)
  on delete set null;

-- product_cost_overrides → products composite org FK
alter table public.product_cost_overrides drop constraint if exists product_cost_overrides_product_id_fkey;
alter table public.product_cost_overrides
  add constraint product_cost_overrides_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;

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

