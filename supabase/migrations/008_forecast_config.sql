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
