-- =============================================================
-- 012_slack_team_mapping.sql
-- Link Slack workspaces to organizations for scoped bot/webhook access.
-- =============================================================

alter table public.organizations
  add column if not exists slack_team_id text;

create unique index if not exists idx_organizations_slack_team_id
  on public.organizations (slack_team_id)
  where slack_team_id is not null;
