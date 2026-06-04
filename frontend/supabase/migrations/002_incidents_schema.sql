-- =============================================================
-- 002_incidents_schema.sql
-- Resolve — Incident Response Platform tables
-- =============================================================

create extension if not exists "uuid-ossp";

-- ---- incidents -----------------------------------------------
create table if not exists incidents (
  id                       uuid primary key default uuid_generate_v4(),
  title                    text not null,
  status                   text not null default 'detected',
    -- detected | investigating | fix_proposed |
    -- awaiting_approval | deploying | monitoring | resolved
  severity                 text not null default 'medium',
    -- critical | high | medium | low
  impact_amount            numeric,        -- e.g. 66235.00
  impact_label             text,           -- "refund exposure"
  affected_product         text,           -- product_id (soft FK)
  affected_kpis            jsonb,          -- ["return_rate", "support_volume"]
  root_cause               text,           -- AI-generated narrative
  root_cause_confidence    integer,        -- 0–100
  created_at               timestamptz     not null default now(),
  resolved_at              timestamptz,
  -- denormalised for fast card rendering
  investigation_started_at timestamptz,
  fix_proposed_at          timestamptz
);

-- ---- agent_findings ------------------------------------------
create table if not exists agent_findings (
  id           uuid primary key default uuid_generate_v4(),
  incident_id  uuid not null references incidents(id) on delete cascade,
  agent_name   text not null,   -- "Returns Agent"
  agent_icon   text,            -- emoji slug: "📦"
  summary      text not null,
  detail       jsonb,           -- full structured output
  created_at   timestamptz not null default now()
);

-- ---- incident_actions ----------------------------------------
create table if not exists incident_actions (
  id           uuid primary key default uuid_generate_v4(),
  incident_id  uuid not null references incidents(id) on delete cascade,
  title        text not null,
  description  text,
  impact_level text,   -- high | medium | low
  risk_level   text,   -- high | medium | low
  auto_deploy  boolean not null default false,
  status       text not null default 'proposed',
    -- proposed | approved | rejected | deployed | monitoring
  approved_by  text,
  approved_at  timestamptz,
  deployed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ---- incident_timeline ----------------------------------------
create table if not exists incident_timeline (
  id           uuid primary key default uuid_generate_v4(),
  incident_id  uuid not null references incidents(id) on delete cascade,
  event_type   text not null,
    -- anomaly_detected | incident_created | agent_assigned |
    -- root_cause_found | action_proposed | approved | deployed |
    -- monitoring | resolved
  description  text not null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists idx_incidents_status      on incidents(status);
create index if not exists idx_incidents_severity    on incidents(severity);
create index if not exists idx_agent_findings_inc    on agent_findings(incident_id);
create index if not exists idx_actions_inc           on incident_actions(incident_id);
create index if not exists idx_timeline_inc          on incident_timeline(incident_id, created_at);
