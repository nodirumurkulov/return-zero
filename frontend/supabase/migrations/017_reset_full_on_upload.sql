-- =============================================================
-- 017_reset_full_on_upload.sql  (RUN-87)
-- Make an onboarding upload a CLEAN SLATE: in addition to the raw contract data,
-- also wipe everything the agent derived from a previous dataset — incidents and
-- their children, the learned knowledge base, prior reports, and the replay clock.
--
-- Keeps CONFIG intact: metric_definitions, forecast_rules, business_settings.
-- After upload the app re-learns baselines + builds a fresh report, and the
-- incidents board starts empty until the stream is played.
-- =============================================================

create or replace function reset_contract_data()
returns void
language sql
set search_path = public
as $$
  truncate table
    -- raw contract data
    line_items, refunds, po_line_items, inventory_movements, support_tickets,
    orders, variants, purchase_orders, products, customers, collections,
    meta_ads_daily, google_ads_daily,
    -- agent-derived state from any prior dataset
    incident_actions, incident_timeline, agent_findings, incidents,
    product_kpi_thresholds, product_baselines, business_reports,
    replay_state
  restart identity cascade;
$$;
