-- =============================================================
-- 011_reset_contract_data.sql  (RUN-79)
-- reset_contract_data() — truncate the raw contract/data tables so an onboarding
-- upload can "replace" the store's data. Cascade handles FK order and clears the
-- dependent product_kpi_thresholds (re-derived after upload in Phase 2).
-- Does NOT touch incidents / agent_findings / incident_* / metric_definitions /
-- forecast_rules / business_settings.
-- =============================================================

create or replace function reset_contract_data()
returns void
language sql
set search_path = public
as $$
  truncate table
    line_items, refunds, po_line_items, inventory_movements, support_tickets,
    orders, variants, purchase_orders, products, customers, collections,
    meta_ads_daily, google_ads_daily
  restart identity cascade;
$$;
