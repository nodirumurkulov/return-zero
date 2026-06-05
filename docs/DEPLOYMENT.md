# Vercel Deployment & Environment Variables (RUN-52)

Authoritative reference for deploying `return-zero` to Vercel and the complete set
of environment variables it needs. The Next.js app lives in **`frontend/`** — there
is no root `package.json`, so the single most important setting is the **Root
Directory**.

---

## 1. One-time Vercel project setup

1. **Import** the GitHub repo into Vercel (Add New… → Project).
2. **Set Root Directory = `frontend`.**
   Click *Edit* next to **Root Directory** and choose `frontend`.
   This is mandatory — without it Vercel builds from the repo root (which has no
   `package.json`) and fails with:
   > `Error: No Next.js version detected. Make sure your package.json has "next"…`
   Root Directory is a **dashboard-only** setting; it cannot be set from
   `vercel.json` ([Vercel docs](https://vercel.com/docs/project-configuration/vercel-json)).
3. **Framework Preset** then auto-detects **Next.js**.
4. Build/install settings come from [`frontend/vercel.json`](../frontend/vercel.json):
   - `installCommand: bun install`
   - `buildCommand: bun run build`, `framework: nextjs`
5. Add the environment variables in §2 (Production **and** Preview).
6. In **Supabase → Authentication → URL configuration**, add your Vercel domain(s) to
   redirect URLs (production domain and `*.vercel.app` previews if needed).
7. **Deploy.**

---

## 2. Environment variables

Set every variable below in **Settings → Environment Variables** for both the
**Production** and **Preview** environments. Source of truth for names is
[`.env.example`](../.env.example).

> **`NEXT_PUBLIC_` prefix = exposed to the browser.** Anything without it is
> server-only and must **never** be given the prefix. The service-role key,
> LLM keys, and `CRON_SECRET` are server-only on purpose.

### Supabase (database + auth)

| Variable | Scope | Required | Where to get it |
|----------|-------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | ✅ | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | ✅ | Supabase → Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | ✅ | Supabase → Project Settings → API → `service_role` key (secret) |

Enable **Email** (or your chosen provider) under Authentication → Providers for demo sign-in.

### LLM (agent investigation)

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `LLM_PROVIDER` | server | ✅ | `openai` or `anthropic` |
| `OPENAI_API_KEY` | server | ✅ if `LLM_PROVIDER=openai` | OpenAI dashboard |
| `ANTHROPIC_API_KEY` | server | ✅ if `LLM_PROVIDER=anthropic` | Anthropic console |

### Slack (notifications + inbound actions)

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `SLACK_WEBHOOK_URL` | server | optional | Outbound incident alerts |
| `SLACK_SIGNING_SECRET` | server | ✅ for inbound buttons | Verifies `/api/slack/webhook` |

### Site / scheduler

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `NEXT_PUBLIC_APP_URL` | client | ✅ | Deployment URL (Slack deep-links) |
| `CRON_SECRET` | server | **✅ in Production** | Bearer for `/api/detect`, `/api/forecast`, `/api/recover`; required when `NODE_ENV=production` |

---

## 3. Scheduler / cron (Vercel Cron)

`/api/detect`, `/api/forecast`, and `/api/recover` use the **service role** and are protected by `CRON_SECRET`:

1. Set `CRON_SECRET` in Vercel (Production **required**).
2. Configure Vercel Cron jobs to `POST` each path with header:
   `Authorization: Bearer <CRON_SECRET>`
3. `frontend/proxy.ts` allows these requests through without a user session when the secret matches.

For manual local testing without a secret, sign in normally and POST while `CRON_SECRET` is unset (dev only).

---

## 4. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `No Next.js version detected` | Root Directory not set to `frontend` (§1.2). |
| Redirected to `/sign-in` forever | Supabase redirect URLs / anon key mismatch; check `NEXT_PUBLIC_SUPABASE_*`. |
| 401 on `/api/*` | Expected when unauthenticated. |
| 503 on `/api/detect` in production | Set `CRON_SECRET` in Vercel env. |
| Slack buttons rejected | `SLACK_SIGNING_SECRET` missing or mismatched. |
| Empty incidents board | Run migrations + `bun run seed` against the Supabase project. |
| BYOD demo needs clean state | Run `select reset_contract_data();` (migrations 016/018) — see [hackathon/demo-verification.md](../hackathon/demo-verification.md). |
