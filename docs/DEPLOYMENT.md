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
   - `installCommand: npm install --legacy-peer-deps` (required — Clerk 7 has a peer
     conflict with Next 14.2)
   - `buildCommand: npm run build`, `outputDirectory: .next`, `framework: nextjs`
5. Add the environment variables in §2 (Production **and** Preview).
6. In the **Clerk dashboard**, add your Vercel domain(s) to the allowed
   origins / redirect URLs (both the production domain and `*.vercel.app` preview
   pattern if you want previews to authenticate).
7. **Deploy.**

---

## 2. Environment variables

Set every variable below in **Settings → Environment Variables** for both the
**Production** and **Preview** environments. Source of truth for names is
[`.env.example`](../.env.example).

> **`NEXT_PUBLIC_` prefix = exposed to the browser.** Anything without it is
> server-only and must **never** be given the prefix (see RUN-29). The
> service-role key, secret keys, and LLM keys are server-only on purpose.

### Clerk (authentication)

| Variable | Scope | Required | Where to get it |
|----------|-------|----------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client | ✅ | Clerk dashboard → API Keys (`pk_...`) |
| `CLERK_SECRET_KEY` | server | ✅ | Clerk dashboard → API Keys (`sk_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | client | ✅ | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | client | ✅ | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | client | ✅ | `/catalog` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | client | ✅ | `/catalog` |

### Supabase (database)

| Variable | Scope | Required | Where to get it |
|----------|-------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | ✅ | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | ✅ | Supabase → Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | ✅ | Supabase → Project Settings → API → `service_role` key (secret) |

### LLM (agent investigation)

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `LLM_PROVIDER` | server | ✅ | `openai` or `anthropic` |
| `OPENAI_API_KEY` | server | ✅ if `LLM_PROVIDER=openai` | OpenAI dashboard |
| `ANTHROPIC_API_KEY` | server | ✅ if `LLM_PROVIDER=anthropic` | Anthropic console |

### Slack (notifications + inbound actions)

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `SLACK_WEBHOOK_URL` | server | ✅ for outbound alerts | Slack Incoming Webhook URL |
| `SLACK_SIGNING_SECRET` | server | ✅ for inbound button clicks | Verifies `/api/slack/webhook` requests (RUN-32) |

### Site / scheduler

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `NEXT_PUBLIC_APP_URL` | client | ✅ | Your deployment URL (e.g. `https://return-zero.vercel.app`). Used in Slack deep-links. |
| `CRON_SECRET` | server | optional | If set, scheduler routes (`/api/detect`, `/api/forecast`, `/api/recover`) accept a `Bearer $CRON_SECRET` header in lieu of a Clerk session (RUN-28). |

---

## 3. Scheduler / cron note (RUN-28 + F5)

`/api/detect`, `/api/forecast`, and `/api/recover` are guarded by
`requireUserOrCron()` — they accept **either** an authenticated Clerk session
**or** a valid `CRON_SECRET`. A Vercel Cron has no Clerk session, so to trigger
them on a schedule you must:

1. Set `CRON_SECRET` in the Vercel env.
2. Add the routes to `isPublicRoute` in `frontend/middleware.ts` **and** have the
   cron send `Authorization: Bearer $CRON_SECRET` (the route still rejects callers
   without the secret). Until the middleware change lands, crons are blocked by
   Clerk before reaching the route (tracked separately as audit finding F5 — see
   [`docs/api-auth-audit.md`](./api-auth-audit.md)).

---

## 4. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `No Next.js version detected` | Root Directory not set to `frontend` (§1.2). |
| `ERESOLVE` peer-dep error during install | Ensure install uses `--legacy-peer-deps` (already in `frontend/vercel.json`). |
| Redirected to `/sign-in` forever | Missing/incorrect Clerk keys, or Vercel domain not in Clerk allowed origins. |
| 401 on every `/api/*` | Expected when unauthenticated — Clerk middleware + route guards (RUN-28). |
| Slack buttons do nothing / rejected | `SLACK_SIGNING_SECRET` missing or mismatched (RUN-32). |
| Empty incidents board | Run the migrations + seed against the Supabase project. |
