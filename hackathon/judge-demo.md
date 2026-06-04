# Judge demo (5 minutes)

Use the **[live demo](https://return-zero-57ht-nodir-s-projects1.vercel.app)** or run locally ([../README.md](../README.md#local-development)).

1. **Sign in** at `/sign-in` (Supabase Auth) — you land on **Catalog**.
2. Open **Court Trainer** (`/catalog/prod_court_trainer`) — note elevated return rate vs thresholds.
3. Go to **Incidents** — open **Court Trainer Return Spike** (pre-seeded, often `awaiting_approval`).
4. Review **agent cards**, **root cause**, and **proposed actions**.
5. **Approve** low-risk actions → incident moves to `deploying` / `monitoring`.

Hero scenario: sizing-driven returns from cold Meta traffic and downstream UK11/UK12 stockouts — see seeded incident in `frontend/scripts/seed.ts`.
