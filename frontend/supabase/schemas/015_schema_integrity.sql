-- =============================================================
-- 015_schema_integrity.sql
-- Composite FK fixes (suppliers, product cost overrides).
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
