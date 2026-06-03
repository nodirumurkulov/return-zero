# Return Zero

AI-powered sizing intelligence for Pretty Fly.  
**Wayflyer × Fin Hackathon | 3–5 June 2026**

## Stack
| Layer | Technology |
|-------|------------|
| Frontend + API | Next.js 14 (App Router) · TypeScript · Tailwind · Recharts |
| Database | Supabase (PostgreSQL) |
| LLM | OpenAI GPT-4o (default) or Anthropic Claude |
| Deploy | Vercel (single deployment — no separate backend) |

## Quick start

### 1. Environment variables

Copy `.env.example` into `frontend/.env.local` and fill in your values:

```bash
cp .env.example frontend/.env.local
# Edit frontend/.env.local:
#   NEXT_PUBLIC_SUPABASE_URL        — from Supabase → Settings → API
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — same page
#   OPENAI_API_KEY                  — your OpenAI key
```

### 2. Seed Supabase

Run the SQL migration first in the Supabase SQL editor (paste the contents of
`supabase/migrations/001_return_zero_schema.sql`), then seed data from the CSVs:

```bash
cd scripts && npm install   # first time only
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
node seed.mjs
```

> The service-role key is in Supabase → Settings → API → `service_role` (secret).  
> Never commit it or put it in `NEXT_PUBLIC_` vars.

### 3. Run the app

```bash
cd frontend
npm install
npm run dev
```

App live at **http://localhost:3000**

## Key numbers
| Metric | Value |
|--------|-------|
| Sizing refund £ (24mo) | £305,692 |
| Court Trainer return rate | 22.5% |
| First-order sizing refunds | 45.6% |
| UK11 trainer stockout | -153 units |

## Route Handlers (API)
All served by Next.js — no separate server needed.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sizing/products` | All products summary |
| GET | `/api/sizing/products/[id]` | Single product detail |
| POST | `/api/sizing/chat` | LLM sizing chat |
| GET | `/api/fitscores` | All fit scores (F → A) |
| GET | `/api/fitscores/[id]/recommendation` | AI fix recommendation |
