-- =============================================================
-- 009_org_integrity.sql
-- Composite FKs so child rows cannot reference parent ids from another org.
-- =============================================================

-- Parent uniqueness for composite FK targets (id is globally unique; pair with org).
alter table public.collections
  add constraint collections_org_id_id_unique unique (organization_id, id);

alter table public.products
  add constraint products_org_id_id_unique unique (organization_id, id);

alter table public.customers
  add constraint customers_org_id_id_unique unique (organization_id, id);

alter table public.orders
  add constraint orders_org_id_id_unique unique (organization_id, id);

alter table public.variants
  add constraint variants_org_id_id_unique unique (organization_id, id);

alter table public.purchase_orders
  add constraint purchase_orders_org_id_id_unique unique (organization_id, id);

alter table public.metric_definitions
  add constraint metric_definitions_org_id_id_unique unique (organization_id, id);

alter table public.incidents
  add constraint incidents_org_id_id_unique unique (organization_id, id);

-- ---- contract cross-table FKs --------------------------------
alter table public.products drop constraint if exists products_collection_id_fkey;
alter table public.products
  add constraint products_collection_org_fkey
  foreign key (organization_id, collection_id)
  references public.collections (organization_id, id)
  on delete set null;

alter table public.variants drop constraint if exists variants_product_id_fkey;
alter table public.variants
  add constraint variants_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;

alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders
  add constraint orders_customer_org_fkey
  foreign key (organization_id, customer_id)
  references public.customers (organization_id, id)
  on delete set null;

alter table public.line_items drop constraint if exists line_items_order_id_fkey;
alter table public.line_items drop constraint if exists line_items_variant_id_fkey;
alter table public.line_items drop constraint if exists line_items_product_id_fkey;
alter table public.line_items
  add constraint line_items_order_org_fkey
  foreign key (organization_id, order_id)
  references public.orders (organization_id, id)
  on delete cascade;
alter table public.line_items
  add constraint line_items_variant_org_fkey
  foreign key (organization_id, variant_id)
  references public.variants (organization_id, id)
  on delete set null;
alter table public.line_items
  add constraint line_items_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;

alter table public.refunds drop constraint if exists refunds_order_id_fkey;
alter table public.refunds
  add constraint refunds_order_org_fkey
  foreign key (organization_id, order_id)
  references public.orders (organization_id, id)
  on delete cascade;

alter table public.inventory_movements drop constraint if exists inventory_movements_variant_id_fkey;
alter table public.inventory_movements
  add constraint inventory_movements_variant_org_fkey
  foreign key (organization_id, variant_id)
  references public.variants (organization_id, id)
  on delete cascade;

alter table public.po_line_items drop constraint if exists po_line_items_po_id_fkey;
alter table public.po_line_items drop constraint if exists po_line_items_variant_id_fkey;
alter table public.po_line_items
  add constraint po_line_items_po_org_fkey
  foreign key (organization_id, po_id)
  references public.purchase_orders (organization_id, id)
  on delete cascade;
alter table public.po_line_items
  add constraint po_line_items_variant_org_fkey
  foreign key (organization_id, variant_id)
  references public.variants (organization_id, id)
  on delete cascade;

-- ---- config / app cross-table FKs ---------------------------
alter table public.product_kpi_thresholds drop constraint if exists product_kpi_thresholds_product_id_fkey;
alter table public.product_kpi_thresholds drop constraint if exists product_kpi_thresholds_metric_definition_id_fkey;
alter table public.product_kpi_thresholds
  add constraint product_kpi_thresholds_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;
alter table public.product_kpi_thresholds
  add constraint product_kpi_thresholds_metric_org_fkey
  foreign key (organization_id, metric_definition_id)
  references public.metric_definitions (organization_id, id)
  on delete cascade;

alter table public.product_baselines drop constraint if exists product_baselines_product_id_fkey;
alter table public.product_baselines drop constraint if exists product_baselines_metric_definition_id_fkey;
alter table public.product_baselines
  add constraint product_baselines_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;
alter table public.product_baselines
  add constraint product_baselines_metric_org_fkey
  foreign key (organization_id, metric_definition_id)
  references public.metric_definitions (organization_id, id)
  on delete cascade;

alter table public.incidents drop constraint if exists incidents_product_id_fkey;
alter table public.incidents
  add constraint incidents_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete set null;

alter table public.agent_findings drop constraint if exists agent_findings_incident_id_fkey;
alter table public.agent_findings
  add constraint agent_findings_incident_org_fkey
  foreign key (organization_id, incident_id)
  references public.incidents (organization_id, id)
  on delete cascade;

alter table public.incident_actions drop constraint if exists incident_actions_incident_id_fkey;
alter table public.incident_actions
  add constraint incident_actions_incident_org_fkey
  foreign key (organization_id, incident_id)
  references public.incidents (organization_id, id)
  on delete cascade;

alter table public.incident_timeline drop constraint if exists incident_timeline_incident_id_fkey;
alter table public.incident_timeline
  add constraint incident_timeline_incident_org_fkey
  foreign key (organization_id, incident_id)
  references public.incidents (organization_id, id)
  on delete cascade;
