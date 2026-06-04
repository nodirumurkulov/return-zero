-- =============================================================
-- 010_recovery.sql  (RUN-22, RUN-23)
-- Recovery tracking + auto-resolve for incidents in monitoring.
--
-- When a fix is approved the incident enters `monitoring`; we snapshot the
-- breached KPI's value (baseline) and its healthy target. A recovery job then
-- tracks PROJECTED recovery toward the target over a horizon and auto-resolves
-- when it reaches 100%.
--
-- NOTE (assumption, per spec): this dataset has no post-fix data, so recovery is
-- a transparent PROJECTION (expected improvement of the deployed action), not a
-- measurement of new data. Surfaced as "projected" everywhere.
-- =============================================================

alter table incidents add column if not exists monitoring_kpi        text;
alter table incidents add column if not exists baseline_value        numeric;
alter table incidents add column if not exists target_value          numeric;
alter table incidents add column if not exists monitoring_started_at timestamptz;
alter table incidents add column if not exists recovery_pct          numeric not null default 0;

insert into business_settings (key, value, label) values
  ('recovery_horizon_days', 21, 'Projected recovery horizon (days)')
on conflict (key) do nothing;
