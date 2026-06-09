# Secrets Management Policy

How secrets are handled, stored, and protected in return-zero.

## Principle: secrets never touch the repo

Secrets (API keys, tokens, signing keys, database credentials) must **never** be committed to version control. This includes:

- `.env.local` files (gitignored)
- Hardcoded strings in source code
- Comments containing real key values
- Test fixtures with production credentials

## Defense layers

### 1. `.gitignore`

`.env.local`, `.env.*.local`, and similar files are gitignored. This is the first line of defense but relies on developers not overriding it.

### 2. Pre-commit hook (gitleaks)

[Gitleaks](https://github.com/gitleaks/gitleaks) runs before every commit via `pre-commit`. It scans staged files for patterns matching known secret formats (AWS keys, Slack tokens, Supabase JWTs, etc.).

```bash
# Install (one-time)
pip install pre-commit
pre-commit install

# Manual scan of all files
pre-commit run gitleaks --all-files

# Scan git history
gitleaks detect --source . --verbose
```

If gitleaks blocks your commit, it means a secret pattern was detected. **Do not bypass it** (`--no-verify`) without verifying the match is a false positive.

### 3. CI scanning

The CI workflow includes a gitleaks step that scans every PR for leaked secrets. PRs with detected secrets will fail the check.

## Secret inventory

| Secret | Environment Variable | Scope | Used By |
|--------|---------------------|-------|---------|
| Supabase URL | `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Auth, data fetching |
| Supabase anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | RLS-scoped queries |
| Supabase service role | `SUPABASE_SERVICE_ROLE_KEY` | Server only | Cron, seed, admin ops |
| OpenAI API key | `OPENAI_API_KEY` | Server only | AI investigation |
| Anthropic API key | `ANTHROPIC_API_KEY` | Server only | AI investigation |
| Slack bot token | `SLACK_BOT_TOKEN` | Server only | @hugo replies |
| Slack signing secret | `SLACK_SIGNING_SECRET` | Server only | Webhook HMAC verification |
| Slack webhook URL | `SLACK_WEBHOOK_URL` | Server only | Proactive alerts |
| Cron secret | `CRON_SECRET` | Server only | Vercel cron auth |
| Shopify API key | `SHOPIFY_API_KEY` | Server only | OAuth + Admin API |
| Shopify API secret | `SHOPIFY_API_SECRET` | Server only | OAuth HMAC |
| App URL | `NEXT_PUBLIC_APP_URL` | Client + Server | CSRF, redirects |

## Rules

1. **`NEXT_PUBLIC_*` variables** are exposed to the browser. Only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `APP_URL` should use this prefix.
2. **Server-only secrets** (`SUPABASE_SERVICE_ROLE_KEY`, LLM keys, Slack tokens, `CRON_SECRET`) must never appear in `"use client"` files or `NEXT_PUBLIC_*` variables.
3. **`.env.example`** contains placeholder values only (`sk-...`, `eyJ...`). Never put real keys there.
4. **Rotation**: if a secret is accidentally committed, rotate it immediately. Removing it from git history is not sufficient — the key is compromised.

## What to do if gitleaks flags a false positive

Add a `#gitleaks:allow` comment on the flagged line, or add the specific pattern to `.gitleaks.toml`'s allowlist. Document why it's a false positive in the commit message.

## History scanning

To scan the full git history for previously leaked secrets:

```bash
gitleaks detect --source . --verbose --report-path gitleaks-report.json
```

Review the report and rotate any real secrets found.
