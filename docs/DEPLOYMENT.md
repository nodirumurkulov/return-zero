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

Uses [Vercel AI SDK](https://sdk.vercel.ai/) (`ToolLoopAgent` + `@ai-sdk/openai` / `@ai-sdk/anthropic`). Local dev wraps the model with `@ai-sdk/devtools` when `NODE_ENV=development` — run `cd frontend && bun run ai:devtools` and open http://localhost:4983 to inspect tool calls.

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `LLM_PROVIDER` | server | ✅ | `openai` or `anthropic` |
| `OPENAI_API_KEY` | server | ✅ if `LLM_PROVIDER=openai` | OpenAI dashboard |
| `ANTHROPIC_API_KEY` | server | ✅ if `LLM_PROVIDER=anthropic` | Anthropic console |
| `OPENAI_MODEL` | server | optional | Default `gpt-5.5` |
| `ANTHROPIC_MODEL` | server | optional | Default `claude-opus-4-5` |

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

### Waitlist email (Resend)

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `RESEND_API_KEY` | server | optional | Sends waitlist confirmation + welcome emails; signups still persist without it |
| `RESEND_FROM_EMAIL` | server | optional | Verified sender, e.g. `Hugo <onboarding@yourdomain.com>` |

Verify your domain in [Resend](https://resend.com) before production. Confirmation links use `NEXT_PUBLIC_APP_URL`.

---

## 3. Scheduler / cron (Vercel Cron)

`/api/detect`, `/api/forecast`, and `/api/recover` use the **service role** and are protected by `CRON_SECRET`:

1. Set `CRON_SECRET` in Vercel (Production **required**).
2. Configure Vercel Cron jobs to `POST` each path with header:
   `Authorization: Bearer <CRON_SECRET>`
3. `frontend/proxy.ts` allows these requests through without a user session when the secret matches.

For manual local testing without a secret, sign in normally and POST while `CRON_SECRET` is unset (dev only).

---

## 4. Database migrations (Supabase GitHub integration)

Schema lives in [`frontend/supabase/`](../frontend/supabase/). Git is the source of truth — do not apply schema changes in the Supabase Dashboard.

Migrations deploy via [Supabase GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration):

- **PRs** — Supabase creates a preview branch and runs migrations (posts **Supabase Preview** check on the PR)
- **`main`** — migrations apply to production automatically on merge

### One-time Dashboard setup

In **Supabase Dashboard → Project Settings → Integrations → GitHub Integration**:

1. **Authorize GitHub** and connect repo `nodirumurkulov/return-zero`
2. **Working directory:** `frontend` (parent of `supabase/` — not the repo root)
3. Enable:
   - **Automatic branching**
   - **Supabase changes only** (preview branches only when `frontend/supabase/**` changes)
   - **Deploy to production**
4. **Production branch:** `main`
5. Subscribe to **email notifications** on the branch for migration failures

### Bootstrap: align remote with repo (one time)

Before enabling **Deploy to production**, confirm remote migration history matches git:

```bash
cd frontend/supabase
supabase link --project-ref <your-project-ref>
supabase migration list          # compare Local vs Remote columns
```

- Remote **behind** repo: first deploy applies pending migrations (expected).
- Remote has **dashboard-only changes** not in git: run a one-time `supabase db pull --db-url <session-pooler-url>`, commit, then enable auto-deploy.

Do **not** enable production deploy until histories match — otherwise migration conflicts block merges.

### Branch protection (recommended)

In **GitHub → Settings → Branches → `main` protection**:

- Enable **Require status checks to pass before merging**
- Add **Supabase Preview** as a required check (Supabase posts this check directly — no custom GitHub Action needed)

### Local pre-PR checks (migration PRs)

CI no longer runs schema drift, RLS, or type-sync checks. Run locally before opening a migration PR:

```bash
cd frontend/supabase && supabase start && cd ..
bun run db:reset
supabase db diff --use-pg-delta   # expect "No schema changes found"
bun run db:lint && bun run db:test:rls && bun run db:check-types
bun run seed && bun run validate
```

After schema changes locally: `cd frontend && bun run db:sync` (reset + regenerate `database.types.ts`).

### Manual migration apply (fallback)

If GitHub integration is unavailable:

```bash
cd frontend/supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

### Preview branches and demo data

Preview branches do **not** copy production data. Demo data is loaded via `bun run seed` ([`frontend/scripts/`](../frontend/scripts/)), not `seed.sql`. Vercel preview deployments still point at production Supabase unless you wire preview env vars to the Supabase preview branch credentials from the PR comment.

---

## 5. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `No Next.js version detected` | Root Directory not set to `frontend` (§1.2). |
| Redirected to `/sign-in` forever | Supabase redirect URLs / anon key mismatch; check `NEXT_PUBLIC_SUPABASE_*`. |
| 401 on `/api/*` | Expected when unauthenticated. |
| 503 on `/api/detect` in production | Set `CRON_SECRET` in Vercel env. |
| Slack buttons rejected | `SLACK_SIGNING_SECRET` missing or mismatched. |
| Empty incidents board | Ensure migrations applied (Supabase GitHub integration or `supabase db push`) + `bun run seed` against the project. |
| Stale TypeScript DB types | Run `cd frontend && bun run db:sync` after pulling migration changes; run `bun run db:check-types` locally before migration PRs. |
| Supabase Preview check failed | See PR comment from Supabase; fix migration SQL and push again. |
