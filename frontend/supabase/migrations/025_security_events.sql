-- =============================================================
-- 025_security_events.sql
-- Append-only security audit log for auth, privilege changes,
-- and API abuse signals. Addresses threat-model findings R1/R2.
-- =============================================================

create type public.security_event_category as enum (
  'auth',
  'privilege',
  'api_abuse',
  'data_access',
  'config_change'
);

create table public.security_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid,
  category        public.security_event_category not null,
  action          text not null,
  severity        public.metric_severity not null default 'low',
  ip_address      text,
  user_agent      text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index idx_security_events_org_created
  on public.security_events (organization_id, created_at desc);

create index idx_security_events_category
  on public.security_events (category, created_at desc);

create index idx_security_events_user
  on public.security_events (user_id, created_at desc)
  where user_id is not null;

-- RLS: service-role only (no authenticated access to audit logs via client).
-- Audit logs should only be readable via admin dashboards or server-side queries.
alter table public.security_events enable row level security;
alter table public.security_events force row level security;
