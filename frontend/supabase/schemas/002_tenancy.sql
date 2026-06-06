-- =============================================================
-- 002_tenancy.sql
-- Multi-tenant foundation: organizations, members, RLS helper.
-- =============================================================

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  active_store_id uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.organization_role not null default 'member',
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index idx_organization_members_user_id
  on public.organization_members (user_id);

-- Returns org ids the current user belongs to (RLS helper in private schema).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role, authenticated;

create or replace function private.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.organization_members
  where user_id = (select auth.uid());
$$;

grant execute on function private.user_organization_ids() to authenticated;
