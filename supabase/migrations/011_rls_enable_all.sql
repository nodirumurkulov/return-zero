-- =============================================================
-- 011_rls_enable_all.sql  (RUN-30 / RUN-33)
-- Enable Row-Level Security on EVERY public table and set sane
-- default policies.  Supersedes 008_rls_policies.sql which was
-- silently skipped on live (version 008 already recorded by
-- 008_forecast_config.sql).
--
-- Model:
--   anon          -> NO access  (RLS + no policy = deny-all).
--   authenticated -> read all data; read+write app tables.
--   service_role  -> bypasses RLS entirely.
--
-- Also fixes the 3 security-advisor warnings about mutable
-- search_path on public functions.
--
-- Idempotent: DROP POLICY IF EXISTS before CREATE; ALTER TABLE
-- … ENABLE ROW LEVEL SECURITY is a no-op when already enabled.
-- =============================================================

-- ---- 1. Read-only tables (imported/mock data + incident detail) ----
do $$
declare
  t text;
  read_only_tables text[] := array[
    'products','variants','customers','orders','line_items','refunds',
    'collections','meta_ads_daily','google_ads_daily','inventory_movements',
    'support_tickets','purchase_orders','po_line_items',
    'incident_actions','incident_timeline'
  ];
begin
  foreach t in array read_only_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I',
                     t || '_authenticated_read', t);
      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        t || '_authenticated_read', t);
    end if;
  end loop;
end $$;

-- ---- 2. Read+write tables (app, config, agent data) ----
do $$
declare
  t text;
  rw_tables text[] := array[
    'product_kpi_thresholds','incidents','agent_findings',
    'business_settings','forecast_rules','metric_definitions'
  ];
begin
  foreach t in array rw_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I',
                     t || '_authenticated_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t || '_authenticated_all', t);
    end if;
  end loop;
end $$;

-- ---- 3. Fix function search_path (security-advisor WARN) ----
alter function public.product_source_facts(integer)  set search_path = '';
alter function public.product_monthly_series(integer) set search_path = '';
alter function public.product_daily_outflow(integer, date) set search_path = '';
