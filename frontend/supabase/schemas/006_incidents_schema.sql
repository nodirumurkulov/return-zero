-- =============================================================
-- 005_incidents_schema.sql
-- Incident hub with typed enums and real FKs.
-- =============================================================

create table public.incidents (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  store_id             uuid not null,
  title                    text not null,
  status                   public.incident_status not null default 'detected',
  severity                 public.incident_severity not null default 'medium',
  impact_amount            numeric(14, 2) check (impact_amount is null or impact_amount >= 0),
  impact_label             text,
  product_id               uuid references public.products(id) on delete set null,
  affected_kpi_keys        text[] not null default '{}',
  root_cause               text,
  root_cause_confidence    integer check (root_cause_confidence is null or (root_cause_confidence >= 0 and root_cause_confidence <= 100)),
  monitoring_kpi           text,
  baseline_value           numeric,
  target_value             numeric,
  monitoring_started_at    timestamptz,
  recovery_pct             numeric not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  resolved_at              timestamptz,
  investigation_started_at timestamptz,
  fix_proposed_at          timestamptz
);

create index idx_incidents_store_id on public.incidents (store_id);

create index idx_incidents_organization_id on public.incidents (organization_id);
create index idx_incidents_organization_status on public.incidents (organization_id, status);
create index idx_incidents_organization_product_status
  on public.incidents (organization_id, product_id, status);
create index idx_incidents_severity on public.incidents (organization_id, severity);

create table public.agent_findings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  incident_id      uuid not null references public.incidents(id) on delete cascade,
  agent_name       text not null,
  agent_icon       text,
  summary          text not null,
  detail           jsonb,
  created_at       timestamptz not null default now()
);

create index idx_agent_findings_organization_id on public.agent_findings (organization_id);
create index idx_agent_findings_incident_id on public.agent_findings (incident_id);

create table public.incident_actions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  incident_id         uuid not null references public.incidents(id) on delete cascade,
  title               text not null,
  description         text,
  impact_level        public.impact_level,
  risk_level          public.risk_level,
  auto_deploy         boolean not null default false,
  status              public.incident_action_status not null default 'proposed',
  approved_by_user_id uuid references auth.users(id) on delete set null,
  approved_at         timestamptz,
  deployed_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_incident_actions_organization_id on public.incident_actions (organization_id);
create index idx_incident_actions_incident_id on public.incident_actions (incident_id);

create table public.incident_timeline (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  incident_id      uuid not null references public.incidents(id) on delete cascade,
  event_type       public.timeline_event_type not null,
  description      text not null,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

create index idx_incident_timeline_organization_id on public.incident_timeline (organization_id);
create index idx_incident_timeline_incident_created
  on public.incident_timeline (organization_id, incident_id, created_at);

alter table public.incidents
  add constraint incidents_store_id_fkey
  foreign key (store_id) references public.store_connections (id) on delete cascade;
