-- =============================================================
-- 022_store_connection_secrets.sql
-- Server-only Shopify OAuth tokens (service_role access only).
-- =============================================================

create table public.store_connection_secrets (
  store_id     uuid primary key references public.store_connections (id) on delete cascade,
  access_token text not null,
  scopes       text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.store_connection_secrets enable row level security;

revoke all on table public.store_connection_secrets from public;
revoke all on table public.store_connection_secrets from anon, authenticated;
grant all on table public.store_connection_secrets to service_role;
