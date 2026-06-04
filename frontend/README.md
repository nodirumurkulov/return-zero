# Resolve — Frontend

The Next.js 14 (App Router) application for **Resolve**, the commerce incident response
platform. All app code, API route handlers, and the Clerk/Supabase integration live here.

Goal of this guide: **a new teammate can run Resolve locally in under 15 minutes.**

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | **18.17+** (20 LTS recommended) | Required by Next.js 14 |
| npm | 9+ | Ships with Node |
| A Supabase project | — | Free tier is fine — [supabase.com](https://supabase.com) |
| A Clerk application | — | Free tier is fine — [clerk.com](https://clerk.com) |
| An OpenAI **or** Anthropic API key | — | For the investigation agents |
| (Optional) A Slack incoming webhook | — | For incident notifications |

---

## 1. Install dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

> **Why `--legacy-peer-deps`?** `@clerk/nextjs@7` declares a peer dependency on
> Next.js 15/16, but this app is pinned to `next@14.2.35`. The flag lets npm install
> the working combination. (Vercel installs respect this via the lockfile.)

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
npm run dev
```

Open **http://localhost:3000**. You'll be redirected to `/sign-in` (all routes except
`/sign-in` and `/sign-up` are protected by Clerk middleware). After signing in you land
on `/catalog`.

---

## Available scripts

Run from `frontend/`:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Next.js lint |

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
└── middleware.ts             # Clerk route protection
```

---

## Deploy to Vercel

1. Import the repo into Vercel and set the **Root Directory** to `frontend`.
2. Framework preset: **Next.js** (auto-detected).
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
| `npm install` fails with `ERESOLVE` peer dep error | Use `npm install --legacy-peer-deps` (see step 1) |
| Redirected to `/sign-in` forever | Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` |
| `/catalog` 404s after sign-in | The catalog route is still in progress; the redirect target is correct |
| Seed script exits with "Missing … URL/KEY" | Ensure `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set |
| Empty incidents board | Run the migrations and the seed script (step 3) |

---

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Clerk (auth) ·
Supabase (Postgres) · OpenAI / Anthropic · Slack · Vercel
