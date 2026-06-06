-- =============================================================
-- 020_investigation_steps.sql
-- Live investigation step feed for in-app agent progress UI.
-- =============================================================

create type public.investigation_step_status as enum ('running', 'done', 'error');

create table public.investigation_steps (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  incident_id      uuid not null,
  run_id           uuid not null,
  step_key         text not null,
  agent_name       text not null,
  label            text not null,
  status           public.investigation_step_status not null default 'running',
  metadata         jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (run_id, step_key),
  constraint investigation_steps_incident_org_fkey
    foreign key (organization_id, incident_id)
    references public.incidents (organization_id, id) on delete cascade
);

create index idx_investigation_steps_run
  on public.investigation_steps (run_id, created_at);

create index idx_investigation_steps_incident
  on public.investigation_steps (organization_id, incident_id, created_at desc);

alter table public.investigation_steps enable row level security;

drop policy if exists investigation_steps_org_all on public.investigation_steps;
create policy investigation_steps_org_all on public.investigation_steps
  for all to authenticated
  using (organization_id in (select private.user_organization_ids()))
  with check (organization_id in (select private.user_organization_ids()));

do $$
begin
  execute 'alter table public.investigation_steps force row level security';
end $$;
