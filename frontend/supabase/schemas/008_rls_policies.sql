-- =============================================================
-- 007_rls_policies.sql
-- RLS on every table; org-scoped policies via user_organization_ids().
-- =============================================================

-- ---- organizations & members ---------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read on public.organizations
  for select to authenticated
  using (id in (select private.user_organization_ids()));

drop policy if exists organization_members_self_read on public.organization_members;
create policy organization_members_self_read on public.organization_members
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---- contract tables: org-scoped read only -------------------
do $$
declare
  t text;
  contract_tables text[] := array[
    'collections', 'products', 'variants', 'customers', 'orders', 'line_items',
    'refunds', 'meta_ads_daily', 'google_ads_daily', 'inventory_movements',
    'support_tickets', 'purchase_orders', 'po_line_items',
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
  end loop;
end $$;

-- ---- config tables: org-scoped read only ---------------------
do $$
declare
  t text;
  config_read_tables text[] := array[
    'metric_definitions', 'product_baselines', 'forecast_rules',
    'business_settings', 'business_reports', 'store_connections'
  ];
begin
  foreach t in array config_read_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_org_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated
       using (organization_id in (select private.user_organization_ids()))',
      t || '_org_read', t
    );
  end loop;
end $$;

-- ---- app tables: org-scoped read + write ---------------------
do $$
declare
  t text;
  app_rw_tables text[] := array[
    'product_kpi_thresholds', 'incidents', 'agent_findings',
    'incident_actions', 'incident_timeline', 'investigation_steps'
  ];
begin
  foreach t in array app_rw_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_org_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
       using (organization_id in (select private.user_organization_ids()))
       with check (organization_id in (select private.user_organization_ids()))',
      t || '_org_all', t
    );
  end loop;
end $$;
