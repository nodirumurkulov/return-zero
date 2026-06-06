# AGENTS.md — lib/slack-auth

Slack-to-Resolve authorization for Hugo and Slack interactive callbacks.
**Parent:** [../AGENTS.md](../AGENTS.md)

## Rules

- Treat Slack user IDs as identity keys, never display names.
- Mutating Slack actions require a linked `organization_members.slack_user_id`
  with role `owner` or `admin`.
- Read-only Hugo intents can run without linked membership.
- Keep route handlers thin; put authorization policy in `authorize.ts`.
