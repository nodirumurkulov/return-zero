# Resolve — Frontend

The Next.js 16 (App Router) application for **Resolve**, the commerce incident response
platform. All app code, API route handlers, and the Clerk/Supabase integration live here.

Goal of this guide: **a new teammate can run Resolve locally in under 15 minutes.**

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Bun](https://bun.sh) | **1.3+** | Package manager and script runner |
| Node.js | **20.9+** | Required by Next.js 16 (used by `next build`) |
| A Supabase project | — | Free tier is fine — [supabase.com](https://supabase.com) |
| A Clerk application | — | Free tier is fine — [clerk.com](https://clerk.com) |
| An OpenAI **or** Anthropic API key | — | For the investigation agents |
| (Optional) A Slack incoming webhook | — | For incident notifications |

---

## 1. Install dependencies

```bash
cd frontend
bun install
```

Lockfile: `bun.lock` (commit it). CI uses `bun ci` (Bun 1.3.14) for reproducible installs.

---

## 2. Configure environment variables

Copy the example file from the repo root into `frontend/.env.local`:

```bash
cp ../.env.example .env.local
```

Then fill in real values:

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` | Keep `/sign-in` and `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `SIGN_UP_...` | `/catalog` (post-auth landing) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**server-only — never expose**) |
| `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` + `LLM_PROVIDER` | OpenAI / Anthropic dashboard |
| `SLACK_WEBHOOK_URL`, `SLACK_SIGNING_SECRET` | Slack app config (optional) |

> `.env.local` is gitignored — never commit real secrets. `NEXT_PUBLIC_*` values are
> exposed to the browser; everything else stays server-side only.

---

## 3. Set up the database

From the **repo root**:

### a. Run the migrations

Apply the SQL in [`supabase/migrations/`](../supabase/migrations) in order:

- `001_base_data_schema.sql` — Pretty Fly base tables (products, orders, metrics…)
- `002_incidents_schema.sql` — app tables (incidents, agent findings, thresholds…)

Easiest path: open **Supabase → SQL Editor**, paste each file, and run them in order.
(Or use the Supabase CLI: `supabase db push`.)

### b. Seed the demo data

The seed script loads the Pretty Fly CSVs and inserts the Court Trainer demo incident:

```bash
cd scripts
npm install
node --env-file=../frontend/.env.local seed.mjs
```

The script is idempotent (upserts), so it's safe to re-run. It requires
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Run the dev server

```bash
cd frontend
bun run dev
```

Open **http://localhost:3000**. You'll be redirected to `/sign-in` (all routes except
`/sign-in` and `/sign-up` are protected by Clerk `proxy.ts`). After signing in you land
on `/catalog`.

---

## Available scripts

Run from `frontend/`:

| Script | Description |
|--------|-------------|
| `bun run dev` | Start the dev server (http://localhost:3000) |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint (flat config) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run check` | Lint + typecheck (same as CI quality gates before build) |

Pull requests must pass the [**CI**](../../.github/workflows/ci.yml) workflow (`bun ci`, lint, typecheck, build).

---

## Project structure

```
frontend/
├── app/
│   ├── api/                  # Route handlers (incidents, investigate, slack webhook)
│   ├── incidents/            # Kanban board + incident detail pages
│   ├── sign-in/ · sign-up/   # Clerk auth pages (branded, redirect → /catalog)
│   ├── layout.tsx            # Root layout (ClerkProvider, header)
│   └── page.tsx              # Redirects to the home route
├── components/
│   ├── incidents/            # Kanban, cards, timeline, findings
│   └── ui/                   # Badges and shared primitives
├── lib/
│   ├── supabase/             # Browser + server (service-role) clients
│   ├── clerk-appearance.ts   # Shared Clerk theme
│   ├── agents.ts · llm.ts    # Agent orchestration + LLM provider
│   └── slack.ts              # Slack notifications
└── proxy.ts                  # Clerk route protection (Next.js 16)
```

---

## Deploy to Vercel

> Full reference (every env var + scopes): [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

1. Import the repo into Vercel and set the **Root Directory** to `frontend`.
   ⚠ This is required — without it the build fails with
   `No Next.js version detected` (the repo root has no `package.json`). Root
   Directory is a dashboard-only setting; it cannot be set via `vercel.json`.
2. Framework preset: **Next.js** (auto-detected once Root Directory is `frontend`).
3. Add every variable from `.env.example` under **Settings → Environment Variables**
   (Production + Preview). Set `NEXT_PUBLIC_APP_URL` to your deployment URL.
4. In the **Clerk dashboard**, add your Vercel domain to the allowed origins/redirect URLs.
5. Deploy. Vercel runs `next build` and serves the app.

> Tip: keep Preview and Production env vars in sync, and use separate Clerk/Supabase
> instances for production if you need isolation.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `bun ci` fails (lockfile mismatch) | Run `bun install` locally and commit `bun.lock` |
| Vercel build: `No Next.js version detected` | Set **Root Directory = `frontend`** in Vercel (see Deploy step 1) |
| Redirected to `/sign-in` forever | Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` |
| `/catalog` 404s after sign-in | The catalog route is still in progress; the redirect target is correct |
| Seed script exits with "Missing … URL/KEY" | Ensure `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set |
| Empty incidents board | Run the migrations and the seed script (step 3) |

---

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Bun · Clerk (auth) ·
Supabase (Postgres) · OpenAI / Anthropic · Slack · Vercel
