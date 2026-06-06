-- =============================================================
-- 014_slack_channel.sql
-- Per-organization Slack channel for proactive bot notifications.
-- =============================================================

alter table public.organizations
  add column if not exists slack_channel_id text;
