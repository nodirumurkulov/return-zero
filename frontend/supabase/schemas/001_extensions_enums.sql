-- =============================================================
-- 001_extensions_enums.sql
-- Extensions and Postgres enum types for app-controlled domains.
-- Contract CSV status fields remain text for BYOD flexibility.
-- =============================================================

create extension if not exists pgcrypto with schema extensions;

-- Tenancy
create type public.organization_role as enum ('owner', 'admin', 'member');

-- Metrics engine
create type public.metric_operation as enum ('ratio', 'value');
create type public.metric_direction as enum ('above', 'below');
create type public.metric_unit as enum ('ratio', 'currency', 'count', 'percentage');
create type public.metric_severity as enum ('critical', 'high', 'medium', 'low');

-- Forecast rules
create type public.forecast_rule_kind as enum (
  'stockout', 'refund_trend', 'roas_decay', 'revenue_drop'
);

-- Store connections
create type public.store_platform as enum ('mock_csv', 'shopify');
create type public.store_sync_mode as enum ('static', 'pull', 'push');
create type public.store_connection_status as enum (
  'pending', 'syncing', 'connected', 'error', 'disconnected'
);

-- Incidents
create type public.incident_status as enum (
  'detected', 'investigating', 'fix_proposed', 'awaiting_approval',
  'deploying', 'monitoring', 'resolved', 'canceled'
);
create type public.incident_severity as enum ('critical', 'high', 'medium', 'low');
create type public.incident_action_status as enum (
  'proposed', 'approved', 'rejected', 'deployed', 'monitoring'
);
create type public.timeline_event_type as enum (
  'anomaly_detected', 'incident_created', 'agent_assigned',
  'root_cause_found', 'action_proposed', 'approved', 'deployed',
  'monitoring', 'resolved'
);
create type public.impact_level as enum ('high', 'medium', 'low');
create type public.risk_level as enum ('high', 'medium', 'low');
