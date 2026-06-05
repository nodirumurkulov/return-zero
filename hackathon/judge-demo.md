# Judge demo (5 minutes)

Use the **[live demo](https://return-zero-57ht-nodir-s-projects1.vercel.app)** or run locally ([../README.md](../README.md#local-development)).

1. **Sign in** at `/sign-in` (Supabase Auth) — you land on **Catalog**.
2. Open **Court Trainer** (`/catalog/prod_00005`) — note elevated return rate vs thresholds.
3. Go to **Incidents** — open **Court Trainer Return Spike** (pre-seeded, £66,235 exposure, often `awaiting_approval`).
4. Optional fresh run: click **Investigate** on a `detected` incident — five agents populate findings and proposed actions.
5. Review **agent cards**, **root cause**, and **proposed actions**.
6. **Approve** low-risk actions → incident moves to `monitoring` and recovery tracking begins.

Hero scenario: sizing-driven returns from cold Meta traffic and downstream UK11/UK12 stockouts — see seeded incident in `frontend/scripts/seed.ts`.

## Production gate (RUN-54)

Run this checklist on the **live Vercel deploy** before marking demo-ready. Requires production env: Supabase, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, optional `SLACK_WEBHOOK_URL` / `DEMO_USER_*`.

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1 | Sign in (Supabase Auth or Pretty Fly demo) | Lands on `/catalog` |
| 2 | Open Court Trainer (`/catalog/prod_00005`) | KPI cards load; thresholds visible |
| 3 | Open **Court Trainer Return Spike** on Incidents kanban | £66,235 exposure shown |
| 4 | **Investigate** (if status is `detected`) | Agent findings + root cause populate |
| 5 | **Approve** low-risk actions (UI or Slack) | Status → `monitoring` |
| 6 | Recovery metrics update (cron `/api/recover` or wait) | Recovery % advances toward resolved |

If any step fails, file a blocker issue before the hackathon gate.
