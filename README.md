# Resolve — Commerce Incident Response Platform

> Incident.io for ecommerce.
> **Wayflyer × Fin Hackathon | 3–5 June 2026**

---

## What is this?

When a KPI breaks — conversion drops, returns spike, inventory stockouts — Resolve automatically
detects it, opens an incident, dispatches AI agents to investigate, proposes fixes, and lets the
operator approve and deploy in one click. It monitors recovery and closes the incident when the
metric returns to normal.

**Engineering has Incident.io. Ecommerce has Resolve.**

---

## Getting started

### 1. Install dependencies

Requires [Bun](https://bun.sh) 1.2+ and Node.js 20.9+.

```bash
cd frontend
bun install
```

### 2. Set up environment variables

```bash
cp .env.example frontend/.env.local
# Fill in your Supabase URL, publishable key, and LLM key
```

### 3. Run the dev server

```bash
cd frontend
bun run dev
```

App available at **http://localhost:3000**

Before opening a PR, run `bun run check` and `bun run build` in `frontend/` (or rely on [CI](.github/workflows/ci.yml)).

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend + API routes | Next.js 16 (App Router) · TypeScript · Tailwind CSS · Bun |
| Database | Supabase (PostgreSQL) |
| LLM | OpenAI GPT-4o (default) or Anthropic Claude |
| Notifications | Slack Incoming Webhooks |
| Deploy | Vercel |

---

## Repo layout

```
resolve/
├── frontend/          # Next.js 16 app — all code lives here
│   ├── app/           # Pages and API Route Handlers
│   ├── components/    # React components
│   └── lib/           # Shared utilities
├── plan/              # HACKATHON_PLAN.md · UI_UX_PLAN.md
├── .env.example       # Copy → frontend/.env.local
└── README.md
```

---

## Team

| Person | Focus |
|--------|-------|
| Person 1 | Detection & Data — KPI monitoring, incident generation, Supabase schema |
| Person 2 | Kanban & Incident UI — homepage, incident board, detail page |
| Person 3 | Agents & Workflows — AI agents, root cause, approval state machine |
| Person 4 | Integrations & Demo — Slack, demo scripting, pitch, final polish |

See `plan/HACKATHON_PLAN.md` for full day-by-day schedule and task breakdown.
