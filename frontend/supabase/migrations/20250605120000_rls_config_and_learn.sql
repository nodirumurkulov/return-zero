-- =============================================================
-- 018_rls_config_and_learn.sql
-- RLS for config and learn tables not covered by 008/015.
--
-- Config tables: authenticated SELECT only (engine/forecast reads).
-- Learn tables: authenticated ALL (align with product_kpi_thresholds).
-- Bulk writes (upload, learn, reset) stay on service_role.
-- =============================================================

-- ---- read-only for authenticated: metric/forecast config -------------------
do $$
declare
  t text;
  read_only_tables text[] := array[
    'metric_definitions',
    'business_settings',
    'forecast_rules'
  ];
begin
  foreach t in array read_only_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_read', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        t || '_authenticated_read', t
      );
    end if;
  end loop;
end $$;

-- ---- read + write for authenticated: learned state -------------------------
do $$
declare
  t text;
  read_write_tables text[] := array['product_baselines', 'business_reports'];
begin
  foreach t in array read_write_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_read', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t || '_authenticated_all', t
      );
    end if;
  end loop;
end $$;
