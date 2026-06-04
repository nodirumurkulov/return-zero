-- =============================================================
-- 003_rls_policies.sql  (RUN-34)
-- Row-Level Security policies for read/write access.
--
-- Model:
--   * anon          -> NO access (RLS enabled + no matching policy = deny).
--   * authenticated -> read all mock data; read+write the app tables.
--   * service_role  -> bypasses RLS entirely (used by server routes via
--                      SUPABASE_SERVICE_ROLE_KEY), so server-side code is
--                      unaffected by these policies.
--
-- Enabling RLS without a policy denies everything, so every table that gets
-- RLS here also gets the policy it needs in the same block. Re-runnable:
-- policies are dropped before being recreated, and table refs are guarded
-- with to_regclass so this migration is safe even if a table (e.g.
-- kpi_thresholds, created by RUN-9) does not exist yet.
-- =============================================================

-- ---- read-only for authenticated: raw "mock data" + read-only incident detail
do $$
declare
  t text;
  read_only_tables text[] := array[
    -- 001_base_data_schema.sql (Pretty Fly mock data)
    'products','variants','customers','orders','line_items','refunds',
    'collections','meta_ads_daily','google_ads_daily','inventory_movements',
    'support_tickets','purchase_orders','po_line_items',
    -- 002_incidents_schema.sql (read-only from the client)
    'incident_actions','incident_timeline'
  ];
begin
  foreach t in array read_only_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_read', t);
      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        t || '_authenticated_read', t
      );
    end if;
  end loop;
end $$;

-- ---- read + write for authenticated: kpi_thresholds, incidents, agent_findings
do $$
declare
  t text;
  read_write_tables text[] := array['kpi_thresholds','incidents','agent_findings'];
begin
  foreach t in array read_write_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      -- `for all` covers select/insert/update/delete; using(true) + with check(true)
      -- => any authenticated user may read and write. anon still has no policy.
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t || '_authenticated_all', t
      );
    end if;
  end loop;
end $$;
