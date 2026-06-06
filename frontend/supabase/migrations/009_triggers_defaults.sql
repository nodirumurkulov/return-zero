-- =============================================================
-- 008_triggers_defaults.sql
-- Org bootstrap defaults + child organization_id enforcement.
-- =============================================================

-- ---- seed defaults for new organizations ---------------------
create or replace function public.seed_organization_defaults(p_organization_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.metric_definitions (
    organization_id, metric_key, display_name, description, unit,
    numerator_source, numerator_field, denominator_source, denominator_field,
    operation, window_days, direction, default_threshold, severity, sort_order,
    impact_source, impact_field, impact_label
  ) values
    (p_organization_id, 'refund_rate', 'Refund rate',
     'Refunded value as a share of revenue', 'ratio',
     'refunds', 'amount', 'sales', 'revenue', 'ratio', 30, 'above', 0.10, 'high', 1,
     'refunds', 'amount', 'refund exposure'),
    (p_organization_id, 'return_rate', 'Return rate',
     'Refunded units as a share of units sold', 'ratio',
     'refunds', 'count', 'sales', 'units', 'ratio', 30, 'above', 0.12, 'high', 2,
     'refunds', 'amount', 'return exposure'),
    (p_organization_id, 'ad_roas', 'Ad ROAS',
     'Ad-attributed revenue per pound of ad spend', 'ratio',
     'ads', 'revenue', 'ads', 'spend', 'ratio', 30, 'below', 1.5, 'medium', 3,
     'ads', 'spend', 'ad spend at risk'),
    (p_organization_id, 'support_volume', 'Support volume',
     'Support tickets referencing the product', 'count',
     'support', 'count', null, null, 'value', 30, 'above', 50, 'medium', 4,
     'support', 'count', 'support tickets');

  insert into public.business_settings (organization_id, key, value, label) values
    (p_organization_id, 'lead_time_days', 71, 'Supplier lead time (days)'),
    (p_organization_id, 'buffer_days', 14, 'Safety buffer (days)'),
    (p_organization_id, 'target_margin', 0.55, 'Target gross margin'),
    (p_organization_id, 'min_roas', 3.0, 'Minimum acceptable ROAS'),
    (p_organization_id, 'recovery_horizon_days', 21, 'Projected recovery horizon (days)');

  insert into public.forecast_rules (
    organization_id, rule_key, kind, horizon_days, threshold, severity
  ) values
    (p_organization_id, 'stockout_lead', 'stockout', 85, 85, 'high'),
    (p_organization_id, 'refund_trend_up', 'refund_trend', 30, 0.15, 'high'),
    (p_organization_id, 'roas_decay_down', 'roas_decay', 30, 1.5, 'medium'),
    (p_organization_id, 'revenue_drop', 'revenue_drop', 90, 0.20, 'medium');

  insert into public.store_connections (
    organization_id, platform, sync_mode, status, replay_cursor
  ) values (
    p_organization_id, 'mock_csv', 'static', 'pending', date '2025-12-01'
  )
  on conflict (organization_id) do nothing;
end;
$$;

create or replace function public.trg_organizations_seed_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.seed_organization_defaults(new.id);
  return new;
end;
$$;

drop trigger if exists organizations_seed_defaults on public.organizations;
create trigger organizations_seed_defaults
  after insert on public.organizations
  for each row execute function public.trg_organizations_seed_defaults();

-- ---- propagate organization_id on incident children ----------
create or replace function public.trg_incident_child_set_organization_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.incidents
  where id = new.incident_id;

  if v_org_id is null then
    raise exception 'incident % not found', new.incident_id;
  end if;

  new.organization_id := v_org_id;
  return new;
end;
$$;

drop trigger if exists agent_findings_set_org on public.agent_findings;
create trigger agent_findings_set_org
  before insert on public.agent_findings
  for each row execute function public.trg_incident_child_set_organization_id();

drop trigger if exists incident_actions_set_org on public.incident_actions;
create trigger incident_actions_set_org
  before insert on public.incident_actions
  for each row execute function public.trg_incident_child_set_organization_id();

drop trigger if exists incident_timeline_set_org on public.incident_timeline;
create trigger incident_timeline_set_org
  before insert on public.incident_timeline
  for each row execute function public.trg_incident_child_set_organization_id();

-- ---- updated_at on incidents -------------------------------
create or replace function public.trg_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists incidents_set_updated_at on public.incidents;
create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute function public.trg_set_updated_at();
