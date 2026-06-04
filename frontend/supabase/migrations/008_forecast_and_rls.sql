-- =============================================================
-- 008_forecast_config.sql  (RUN-65)
-- Config for PREDICTIVE detection — forward-looking incidents from forecasts.
-- Mirrors the metric_definitions philosophy: rules are DATA, not hardcoded.
--
-- `business_settings`: the brief's "signup knobs" (supplier lead time, buffer,
-- target margin, min ROAS), finally real — used by forecasts (lead time drives
-- the stockout reorder window). Edit per business; no code change.
-- =============================================================

create table if not exists business_settings (
  key        text primary key,
  value      numeric not null,
  label      text
);

insert into business_settings (key, value, label) values
  ('lead_time_days', 71,   'Supplier lead time (days)'),
  ('buffer_days',    14,   'Safety buffer (days)'),
  ('target_margin',  0.55, 'Target gross margin'),
  ('min_roas',       3.0,  'Minimum acceptable ROAS')
on conflict (key) do nothing;

-- ---- forecast_rules ------------------------------------------
-- kind interprets `threshold`:
--   stockout      -> alarm when days_to_stockout <= threshold (days)
--   refund_trend  -> alarm when forecast refund rate     >= threshold
--   roas_decay    -> alarm when forecast ROAS            <= threshold
--   revenue_drop  -> alarm when forecast revenue is <= (1 - threshold) x recent avg
create table if not exists forecast_rules (
  id           uuid primary key default gen_random_uuid(),
  rule_key     text not null unique,
  kind         text not null check (kind in ('stockout', 'refund_trend', 'roas_decay', 'revenue_drop')),
  horizon_days integer not null default 30,
  threshold    numeric not null,
  severity     text not null default 'medium',
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);

insert into forecast_rules (rule_key, kind, horizon_days, threshold, severity) values
  ('stockout_lead',    'stockout',     85, 85,   'high'),   -- within lead+buffer (71+14)
  ('refund_trend_up',  'refund_trend', 30, 0.15, 'high'),
  ('roas_decay_down',  'roas_decay',   30, 1.5,  'medium'),
  ('revenue_drop',     'revenue_drop', 90, 0.20, 'medium')
on conflict (rule_key) do nothing;
-- =============================================================
-- 008_rls_policies.sql  (RUN-34)
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
-- with to_regclass so this migration is safe even if a table does not exist yet.
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

-- ---- read + write for authenticated: product_kpi_thresholds, incidents, agent_findings
-- (the issue calls the thresholds table "kpi_thresholds"; RUN-9 named it
--  product_kpi_thresholds in 003_metrics_config.sql.)
do $$
declare
  t text;
  read_write_tables text[] := array['product_kpi_thresholds','incidents','agent_findings'];
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
