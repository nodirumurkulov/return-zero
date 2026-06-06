-- =============================================================
-- 004_store_contract_tables.sql
-- Hugo mock store contract tables missing from 003 + org-scoped FKs.
-- =============================================================

-- ---- suppliers ------------------------------------------------
create table public.suppliers (
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

create index idx_suppliers_organization_id on public.suppliers (organization_id);

-- ---- product_collections (M:N) -------------------------------
create table public.product_collections (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete cascade,
  collection_id    uuid not null references public.collections(id) on delete cascade,
  unique (organization_id, product_id, collection_id)
);

create index idx_product_collections_organization_id
  on public.product_collections (organization_id);
create index idx_product_collections_product_id
  on public.product_collections (product_id);
create index idx_product_collections_collection_id
  on public.product_collections (collection_id);

-- ---- addresses ------------------------------------------------
create table public.addresses (
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

create index idx_addresses_organization_id on public.addresses (organization_id);
create index idx_addresses_customer_id on public.addresses (customer_id);

-- ---- discount_codes -------------------------------------------
create table public.discount_codes (
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

create index idx_discount_codes_organization_id on public.discount_codes (organization_id);

-- ---- email_campaigns ------------------------------------------
create table public.email_campaigns (
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

create index idx_email_campaigns_organization_id on public.email_campaigns (organization_id);

-- ---- email_events ---------------------------------------------
create table public.email_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  campaign_id      uuid references public.email_campaigns(id) on delete cascade,
  customer_id      uuid references public.customers(id) on delete set null,
  event_type       text,
  timestamp        timestamptz,
  unique (organization_id, external_id)
);

create index idx_email_events_organization_id on public.email_events (organization_id);
create index idx_email_events_campaign_id on public.email_events (campaign_id);
create index idx_email_events_customer_id on public.email_events (customer_id);

-- ---- support_messages (one row per ticket) --------------------
create table public.support_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  external_id      text not null,
  ticket_id        uuid not null references public.support_tickets(id) on delete cascade,
  messages         jsonb not null default '[]'::jsonb,
  unique (organization_id, external_id)
);

create index idx_support_messages_organization_id on public.support_messages (organization_id);
create index idx_support_messages_ticket_id on public.support_messages (ticket_id);

-- ---- bank_transactions ----------------------------------------
create table public.bank_transactions (
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

create index idx_bank_transactions_organization_id on public.bank_transactions (organization_id);
create index idx_bank_transactions_organization_date
  on public.bank_transactions (organization_id, date);
