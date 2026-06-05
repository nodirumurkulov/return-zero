# End-to-end demo verification (RUN-113)

Final gate for the RUN-107 BYOD epic. Run on the **live Vercel deploy** or locally with Supabase + migrations applied.

## Prerequisites

- Migrations through `019_business_profile.sql` applied
- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) set on Vercel for agent narration
- Optional: `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` for one-click Pretty Fly sign-in

## Clean slate reset

```bash
cd frontend
# Local: reset contract data + derived state (see migration 016/018)
psql "$DATABASE_URL" -c "select reset_contract_data();"
```

After reset: **0 products, 0 incidents, empty board**, onboarding upload screen.

## Verification script

| # | Step | Pass criteria |
|---|------|---------------|
| 1 | Run clean-slate reset | Empty catalog/incidents; onboarding shows upload only |
| 2 | Sign up | Lands on `/onboarding` |
| 3 | Upload history CSVs + fill business profile | Profile saves; learn runs |
| 4 | Agent learns baselines + business report | `/onboarding/report` shows real numbers |
| 5 | Incidents board empty | `/incidents` has no open cards |
| 6 | Orders → press **Start** | Stream replays; orders feed updates |
| 7 | Incidents open live | Cards appear with severity/impact |
| 8 | Open incident → agent finding + action | Why-now narrative and proposed action visible |
| 9 | Counterfactual headline | £ surfaced + avg lead time shown on board |
| 10 | Reset again | Returns to clean state without manual DB edits |

## Automated coverage

- `e2e/specs/onboarding.spec.ts` — upload → profile → report (mocked APIs)
- `e2e/specs/orders.spec.ts` — replay start + incidents board smoke
- `e2e/specs/incident-detail.spec.ts` — findings, approve, investigate stub

## Capture for pitch

Record a short GIF of steps 2–8 after a clean reset for the hackathon deck.
