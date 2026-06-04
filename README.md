# Resolve (return-zero)

Ecommerce incident response for the Pretty Fly demo brand: detect KPI breaches, investigate with AI, approve fixes, and track recovery.

**Stack:** Next.js 16 · TypeScript · Supabase · Clerk · Vercel · Bun (`frontend/`)

## Overview

| Piece | Location |
|-------|----------|
| Web app and API | [`frontend/`](frontend/) |
| Database migrations | [`supabase/`](supabase/) |
| Seed and validation scripts | [`scripts/`](scripts/) |
| Deployment and analytics docs | [`docs/`](docs/) |
| Hackathon CSV data | [`pretty_fly_data_pack/`](pretty_fly_data_pack/) |

Humans read **`README.md`** in each folder; coding agents read the matching **`AGENTS.md`**.

## Prerequisites

- [Bun](https://bun.sh) 1.3+ (frontend install, lint, build)
- [Node.js](https://nodejs.org) 20+ (scripts only)
- Supabase project with migrations applied
- Clerk application (publishable + secret keys)
- LLM API key (OpenAI or Anthropic)

## Environment variables

Copy [`.env.example`](.env.example) to `frontend/.env.local` and fill in values.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_*` | Clerk auth URLs and publishable key |
| `CLERK_SECRET_KEY` | Server-side Clerk (never `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server routes and scripts only |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Investigation agents |
| `LLM_PROVIDER` | `openai` or `anthropic` |
| `SLACK_WEBHOOK_URL` | Outbound incident notifications (optional) |
| `NEXT_PUBLIC_APP_URL` | Base URL for links in Slack |
| `CRON_SECRET` | Protects `/api/detect`, `/api/forecast`, `/api/recover` when set |

Details: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Local development

```bash
cp .env.example frontend/.env.local   # edit with real keys
cd frontend && bun install && bun run dev
```

Open http://localhost:3000

### Seed demo data (optional)

```bash
cd scripts && npm install
npm run seed    # loads pretty_fly_data_pack CSVs + demo incident
```

Validators need a seeded project: `npm run validate` (see [`scripts/README.md`](scripts/README.md)).

### Before you open a PR

```bash
cd frontend && bun run check && bun run build
cd frontend && bun run verify:secrets
```

## Deployment

Deploy on Vercel with **Root Directory** set to `frontend`. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Empty catalog or incidents | DB not seeded | Run `scripts` seed against your Supabase project |
| Auth redirect loops | Clerk URL mismatch | Match sign-in/up URLs in Clerk dashboard and `.env.local` |
| Investigation fails | Missing LLM key or provider | Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` and `LLM_PROVIDER` |
| Cron routes 401 | `CRON_SECRET` set | Send `Authorization: Bearer $CRON_SECRET` or clear for local dev |

## Related docs

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel, env, cron
- [`docs/analytics-and-forecasting.md`](docs/analytics-and-forecasting.md) — metrics and forecast behavior
- [`AGENTS.md`](AGENTS.md) — agent coding rules

**Last reviewed:** 2026-06-04
