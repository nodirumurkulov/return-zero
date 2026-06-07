-- =============================================================
-- 024_slack_member_auth.sql
-- Link Slack users to Resolve organization members for action authorization.
-- =============================================================

alter table public.organization_members
  add column if not exists slack_user_id text;

create unique index if not exists organization_members_org_slack_user_unique
  on public.organization_members (organization_id, slack_user_id)
  where slack_user_id is not null;
