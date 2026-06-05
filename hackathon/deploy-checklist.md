# Deploy (RUN-53)

Frontend deploys from `frontend/` on Vercel.

## Required environment variables

Copy from [`.env.example`](../.env.example) into Vercel project settings (repo root):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY` + `LLM_PROVIDER=anthropic`)
- `SLACK_WEBHOOK_URL` / `SLACK_SIGNING_SECRET` (optional for demo)
- `NEXT_PUBLIC_APP_URL` (production URL)

## Deploy

```bash
cd frontend
npm install --legacy-peer-deps
npm run build   # passes without local .env when API routes use force-dynamic
npx vercel --prod
```

Set **Root Directory** to `frontend` in the Vercel project settings.

**Note:** Production runtime still requires all env vars above. `npm run build` only needs them if pages/routes are statically prerendered at build time — API routes are marked `force-dynamic` so CI/Vercel can build before secrets are wired (RUN-52).

## Post-deploy checklist

- [ ] Sign in via Supabase Auth works
- [ ] `/catalog` loads 62 products
- [ ] Court Trainer (`/catalog/prod_00005`) shows return spike
- [ ] `/incidents` shows INC-247 demo incident
- [ ] Slack approve button updates incident (if configured)
