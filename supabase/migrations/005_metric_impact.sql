-- =============================================================
-- 005_metric_impact.sql
-- Config-driven incident IMPACT.
--
-- When breach detection (RUN-20) opens an incident, the £/figure shown on it
-- should also be configuration, not hardcoded in the detector. Each metric
-- declares which source fact represents its exposure and how to label it.
--   (impact_source, impact_field) -> the `<source>_<field>` column from
--   product_source_facts(); impact_label is the human label on the incident.
-- =============================================================

alter table metric_definitions add column if not exists impact_source text;
alter table metric_definitions add column if not exists impact_field  text;
alter table metric_definitions add column if not exists impact_label  text;

update metric_definitions set impact_source = 'refunds', impact_field = 'amount', impact_label = 'refund exposure'  where metric_key = 'refund_rate';
update metric_definitions set impact_source = 'refunds', impact_field = 'amount', impact_label = 'return exposure'  where metric_key = 'return_rate';
update metric_definitions set impact_source = 'ads',     impact_field = 'spend',  impact_label = 'ad spend at risk' where metric_key = 'ad_roas';
update metric_definitions set impact_source = 'support', impact_field = 'count',  impact_label = 'support tickets'  where metric_key = 'support_volume';

-- Threshold correction: 3.0 is the ROAS *target*, but as an incident *alarm* line
-- it breaches nearly every product. Use 1.5 — the bar the existing detector logic
-- already uses (frontend/lib/agents.ts) — so breach detection fires on genuinely
-- bad ROAS, not "below aspirational target". (Still config; tune per business.)
update metric_definitions set default_threshold = 1.5 where metric_key = 'ad_roas';
