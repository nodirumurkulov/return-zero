-- =============================================================
-- 011_business_profile.sql
-- Org-scoped business profile + product cost overrides; config writes.
-- =============================================================

create table public.business_profile (
  organization_id   uuid primary key references public.organizations(id) on delete cascade,
  platform          text not null default 'shopify',
  store_name        text not null default '',
  primary_goal      text not null default 'growth',
  hero_product_ids  uuid[] not null default '{}',
  updated_at        timestamptz not null default now()
);

create table public.product_cost_overrides (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  cost_per_unit   numeric not null,
  updated_at      timestamptz not null default now(),
  primary key (organization_id, product_id)
);

create index idx_product_cost_overrides_org
  on public.product_cost_overrides (organization_id);

-- ---- RLS: business_profile + product_cost_overrides ----------------
alter table public.business_profile enable row level security;
alter table public.product_cost_overrides enable row level security;

create policy business_profile_org_all on public.business_profile
  for all to authenticated
  using (organization_id in (select private.user_organization_ids()))
  with check (organization_id in (select private.user_organization_ids()));

create policy product_cost_overrides_org_all on public.product_cost_overrides
  for all to authenticated
  using (organization_id in (select private.user_organization_ids()))
  with check (organization_id in (select private.user_organization_ids()));

-- ---- RLS: allow org members to update config they manage -------------
do $$
declare
  t text;
  config_write_tables text[] := array[
    'business_settings', 'forecast_rules', 'metric_definitions'
  ];
begin
  foreach t in array config_write_tables loop
    execute format('drop policy if exists %I on public.%I', t || '_org_write', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
       with check (organization_id in (select private.user_organization_ids()))',
      t || '_org_write_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated
       using (organization_id in (select private.user_organization_ids()))
       with check (organization_id in (select private.user_organization_ids()))',
      t || '_org_write_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated
       using (organization_id in (select private.user_organization_ids()))',
      t || '_org_write_delete', t
    );
  end loop;
end $$;

-- ---- force RLS (defense in depth) ----------------------------------
alter table public.business_profile force row level security;
alter table public.product_cost_overrides force row level security;
