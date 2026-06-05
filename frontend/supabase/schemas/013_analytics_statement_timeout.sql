-- =============================================================
-- 013_analytics_statement_timeout.sql
-- The analytics RPCs aggregate the full 24-month history (orders × line_items ×
-- refunds × ad spend, with campaign→product revenue attribution). On a freshly
-- seeded database this single query can exceed the role's default
-- statement_timeout — "canceling statement due to statement timeout" (SQLSTATE
-- 57014) — as seen in the validate:metrics check calling product_monthly_series.
--
-- Raise the timeout for ONLY these two heavy analytics functions. The SET clause
-- applies a function-local statement_timeout while the function executes; it does
-- not change the global/role default for any other statement.
-- =============================================================

alter function public.product_monthly_series(uuid, integer)
  set statement_timeout = '120s';

alter function public.product_source_facts(uuid, integer, date)
  set statement_timeout = '120s';
