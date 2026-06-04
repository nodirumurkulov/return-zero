# Resolve

Incident response for ecommerce: detect KPI breaches, investigate with AI, approve fixes, track recovery.

**Stack:** Next.js 16 · TypeScript · Supabase · Clerk · Vercel · Bun (frontend)

## Quick start

```bash
cp .env.example frontend/.env.local   # fill Supabase, Clerk, LLM keys
cd frontend && bun install && bun run dev
```

Open http://localhost:3000

Before a PR:

```bash
cd frontend && bun run check && bun run build
```

## Layout

| Directory | Purpose |
|-----------|---------|
| [`frontend/`](frontend/) | Web app and API routes |
| [`scripts/`](scripts/) | Data seed and row-count validation (Node) |
| [`supabase/`](supabase/) | Postgres migrations |
| [`docs/`](docs/) | Deployment and architecture |

## Deploy

Vercel root directory: **`frontend`**. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Contributing

Every major folder has **`README.md`** (humans) and **`AGENTS.md`** (coding agents). Read the pair for the directory you are changing.

| Audience | Start here |
|----------|------------|
| Humans | [`README.md`](README.md) → nested `README.md` |
| Agents | [`AGENTS.md`](AGENTS.md) → nested `AGENTS.md` |
