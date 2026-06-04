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

- Humans: this README and per-folder `README.md` where present.
- AI/agents: read [`agents.md`](agents.md) and the `agents.md` in the folder you edit.
