-- =============================================================
-- 019_drop_orphan_metric_views.sql
-- Remove unused views from 003; catalog uses the metrics engine.
-- =============================================================

drop view if exists product_metrics_monthly_view;
drop view if exists product_metrics_view;
