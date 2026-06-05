-- =============================================================
-- 014_fix_source_facts_overload.sql  (RUN-82 follow-up)
--
-- 013_replay.sql added product_source_facts(p_window_days int, p_asof date) via
-- `create or replace function`. Because the argument list differs from the
-- original product_source_facts(p_window_days int) in 004, Postgres created a
-- SECOND overload instead of replacing it. A call without p_asof is then
-- ambiguous ("could not choose the best candidate function").
--
-- Drop the single-arg version; the (int, date) version (p_asof defaults null)
-- fully covers it. Idempotent — safe whether or not the old overload is present.
-- =============================================================

drop function if exists product_source_facts(integer);
