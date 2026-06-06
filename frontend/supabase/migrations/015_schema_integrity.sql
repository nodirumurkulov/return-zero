-- =============================================================
-- 015_schema_integrity.sql
-- Composite FK fixes and reset_organization_data completeness.
-- Superseded by reset_store_data in 017_multi_store.sql for store-scoped resets.
-- =============================================================

-- Repair prod drift: 004 tables missing despite migration history.
create table if not exists public.suppliers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  name             text,
  country          text,
  payment_terms    text,
  lead_time_days   integer,
  currency         text,
  unique (organization_id, external_id)
);

create index if not exists idx_suppliers_organization_id on public.suppliers (organization_id);

create table if not exists public.product_collections (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete cascade,
  collection_id    uuid not null references public.collections(id) on delete cascade,
  unique (organization_id, product_id, collection_id)
);

create index if not exists idx_product_collections_organization_id
  on public.product_collections (organization_id);
create index if not exists idx_product_collections_product_id
  on public.product_collections (product_id);
create index if not exists idx_product_collections_collection_id
  on public.product_collections (collection_id);

create table if not exists public.addresses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  customer_id      uuid not null references public.customers(id) on delete cascade,
  first_name       text,
  last_name        text,
  address1         text,
  address2         text,
  city             text,
  province         text,
  postcode         text,
  country          text,
  unique (organization_id, external_id)
);

create index if not exists idx_addresses_organization_id on public.addresses (organization_id);
create index if not exists idx_addresses_customer_id on public.addresses (customer_id);

create table if not exists public.discount_codes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  code             text not null,
  type             text,
  value            numeric(14, 2) check (value is null or value >= 0),
  usage_count      integer,
  starts_at        timestamptz,
  ends_at          timestamptz,
  unique (organization_id, external_id),
  unique (organization_id, code)
);

create index if not exists idx_discount_codes_organization_id on public.discount_codes (organization_id);

create table if not exists public.email_campaigns (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  external_id            text not null,
  name                   text,
  type                   text,
  sent_at                timestamptz,
  recipients             integer,
  opens                  integer,
  clicks                 integer,
  unsubscribes           integer,
  attributed_orders      integer,
  attributed_revenue_gbp numeric(14, 2) check (
    attributed_revenue_gbp is null or attributed_revenue_gbp >= 0
  ),
  unique (organization_id, external_id)
);

create index if not exists idx_email_campaigns_organization_id on public.email_campaigns (organization_id);

create table if not exists public.email_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  campaign_id      uuid references public.email_campaigns(id) on delete cascade,
  customer_id      uuid references public.customers(id) on delete set null,
  event_type       text,
  timestamp        timestamptz,
  unique (organization_id, external_id)
);

create index if not exists idx_email_events_organization_id on public.email_events (organization_id);
create index if not exists idx_email_events_campaign_id on public.email_events (campaign_id);
create index if not exists idx_email_events_customer_id on public.email_events (customer_id);

create table if not exists public.support_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  ticket_id        uuid not null references public.support_tickets(id) on delete cascade,
  messages         jsonb not null default '[]'::jsonb,
  unique (organization_id, external_id)
);

create index if not exists idx_support_messages_organization_id on public.support_messages (organization_id);
create index if not exists idx_support_messages_ticket_id on public.support_messages (ticket_id);

create table if not exists public.bank_transactions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  date             date not null,
  description      text,
  amount_gbp       numeric(14, 2),
  balance_gbp      numeric(14, 2),
  counterparty     text,
  category         text,
  raw_category     text,
  unique (organization_id, external_id)
);

create index if not exists idx_bank_transactions_organization_id on public.bank_transactions (organization_id);
create index if not exists idx_bank_transactions_organization_date
  on public.bank_transactions (organization_id, date);

do $$
declare
  t text;
  contract_tables text[] := array[
    'suppliers', 'product_collections', 'addresses', 'discount_codes',
    'email_campaigns', 'email_events', 'support_messages', 'bank_transactions'
  ];
begin
  foreach t in array contract_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_org_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated
       using (organization_id in (select private.user_organization_ids()))',
      t || '_org_read', t
    );
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- 010 may already add these; email_events FK depends on email_campaigns pair — never drop/recreate.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'suppliers_org_id_id_unique'
  ) then
    alter table public.suppliers
      add constraint suppliers_org_id_id_unique unique (organization_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'email_campaigns_org_id_id_unique'
  ) then
    alter table public.email_campaigns
      add constraint email_campaigns_org_id_id_unique unique (organization_id, id);
  end if;
end $$;

alter table public.product_collections drop constraint if exists product_collections_product_id_fkey;
alter table public.product_collections drop constraint if exists product_collections_collection_id_fkey;
alter table public.product_collections drop constraint if exists product_collections_product_org_fkey;
alter table public.product_collections drop constraint if exists product_collections_collection_org_fkey;
alter table public.product_collections
  add constraint product_collections_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;
alter table public.product_collections
  add constraint product_collections_collection_org_fkey
  foreign key (organization_id, collection_id)
  references public.collections (organization_id, id)
  on delete cascade;

-- purchase_orders.supplier_id (text external id) → suppliers(organization_id, external_id)
insert into public.suppliers (organization_id, external_id)
select distinct po.organization_id, po.supplier_id
from public.purchase_orders po
where po.supplier_id is not null
  and not exists (
    select 1
    from public.suppliers s
    where s.organization_id = po.organization_id
      and s.external_id = po.supplier_id
  );

alter table public.purchase_orders drop constraint if exists purchase_orders_supplier_org_fkey;
alter table public.purchase_orders
  add constraint purchase_orders_supplier_org_fkey
  foreign key (organization_id, supplier_id)
  references public.suppliers (organization_id, external_id)
  on delete set null;

-- product_cost_overrides → products composite org FK
alter table public.product_cost_overrides drop constraint if exists product_cost_overrides_product_id_fkey;
alter table public.product_cost_overrides drop constraint if exists product_cost_overrides_product_org_fkey;
alter table public.product_cost_overrides
  add constraint product_cost_overrides_product_org_fkey
  foreign key (organization_id, product_id)
  references public.products (organization_id, id)
  on delete cascade;

create or replace function public.reset_organization_data(p_organization_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.incident_actions where organization_id = p_organization_id;
  delete from public.incident_timeline where organization_id = p_organization_id;
  delete from public.agent_findings where organization_id = p_organization_id;
  delete from public.incidents where organization_id = p_organization_id;
  delete from public.product_kpi_thresholds where organization_id = p_organization_id;
  delete from public.product_baselines where organization_id = p_organization_id;
  delete from public.business_reports where organization_id = p_organization_id;
  delete from public.product_cost_overrides where organization_id = p_organization_id;
  delete from public.business_profile where organization_id = p_organization_id;

  delete from public.support_messages where organization_id = p_organization_id;
  delete from public.email_events where organization_id = p_organization_id;
  delete from public.product_collections where organization_id = p_organization_id;
  delete from public.addresses where organization_id = p_organization_id;
  delete from public.discount_codes where organization_id = p_organization_id;
  delete from public.suppliers where organization_id = p_organization_id;
  delete from public.bank_transactions where organization_id = p_organization_id;
  delete from public.email_campaigns where organization_id = p_organization_id;

  update public.store_connections
  set
    replay_cursor = date '2025-12-01',
    status = 'pending',
    last_synced_at = null,
    updated_at = now()
  where organization_id = p_organization_id;

  delete from public.line_items where organization_id = p_organization_id;
  delete from public.refunds where organization_id = p_organization_id;
  delete from public.po_line_items where organization_id = p_organization_id;
  delete from public.inventory_movements where organization_id = p_organization_id;
  delete from public.support_tickets where organization_id = p_organization_id;
  delete from public.orders where organization_id = p_organization_id;
  delete from public.variants where organization_id = p_organization_id;
  delete from public.purchase_orders where organization_id = p_organization_id;
  delete from public.products where organization_id = p_organization_id;
  delete from public.collections where organization_id = p_organization_id;
  delete from public.customers where organization_id = p_organization_id;
  delete from public.google_ads_daily where organization_id = p_organization_id;
  delete from public.meta_ads_daily where organization_id = p_organization_id;
end;
$$;
