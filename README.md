# Return Zero

AI-powered sizing intelligence for Pretty Fly.
**Wayflyer × Fin Hackathon | 3–5 June 2026**

## Quick start

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env .env.local   # add your real API key
uvicorn main:app --reload --port 8000
```
API live at http://localhost:8000 — visit http://localhost:8000/docs for Swagger UI.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App live at http://localhost:3000

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Recharts
- **Backend:** FastAPI + pandas (all data in-memory, pre-computed at startup)
- **LLM:** OpenAI GPT-4o (swap to Anthropic via `LLM_PROVIDER=anthropic`)

## Key numbers
| Metric | Value |
|--------|-------|
| Sizing refund £ (24mo) | £305,692 |
| Court Trainer return rate | 22.5% |
| First-order sizing refunds | 45.6% |
| UK11 trainer stockout | -153 units |
