# Scripts

Node utilities for seeding and validating hackathon data (not Bun).

```bash
cd scripts
npm install
npm run seed
npm run validate:counts   # row counts vs data pack (needs Supabase env)
npm run validate:metrics  # RPC sanity checks
npm run validate          # both validators
```

Environment (same as the app):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional: `node --env-file=../frontend/.env.local seed.mjs`

Shared helpers live in `lib/` (`createScriptClient`, `chunkArray`).

Agents: [AGENTS.md](AGENTS.md).
