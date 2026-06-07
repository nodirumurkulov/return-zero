-- Emergency production schema repair for a database that is behind local migrations.
-- Mirrors the idempotent parts of:
--   - migrations/020_investigation_steps.sql
--   - migrations/024_slack_member_auth.sql

do $$
begin
  create type public.investigation_step_status as enum ('running', 'done', 'error');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.investigation_steps (
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

create index if not exists idx_investigation_steps_run
  on public.investigation_steps (run_id, created_at);

create index if not exists idx_investigation_steps_incident
  on public.investigation_steps (organization_id, incident_id, created_at desc);

alter table public.investigation_steps enable row level security;

drop policy if exists investigation_steps_org_all on public.investigation_steps;
create policy investigation_steps_org_all on public.investigation_steps
  for all to authenticated
  using (organization_id in (select private.user_organization_ids()))
  with check (organization_id in (select private.user_organization_ids()));

alter table public.investigation_steps force row level security;

alter table public.organization_members
  add column if not exists slack_user_id text;

create unique index if not exists organization_members_org_slack_user_unique
  on public.organization_members (organization_id, slack_user_id)
  where slack_user_id is not null;

notify pgrst, 'reload schema';

select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'slack_user_id'
  ) as has_slack_user_id,
  to_regclass('public.investigation_steps') is not null as has_investigation_steps;
