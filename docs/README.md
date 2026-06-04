# Docs

Long-form human reference for deployment and analytics behavior. Keep procedural detail here; keep [`AGENTS.md`](../AGENTS.md) for coding rules.

## What's here

| Document | Audience | Contents |
|----------|----------|----------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Operators | Vercel setup, env vars, cron routes |
| [analytics-and-forecasting.md](analytics-and-forecasting.md) | Engineers | Metrics engine, forecast rules, validation |

## Usage

Read before changing detection, metrics, or production configuration.

Row-count validation after seeding is documented in [analytics-and-forecasting.md](analytics-and-forecasting.md) and implemented in [`../scripts/validate-counts.mjs`](../scripts/validate-counts.mjs).

## Notes

- Do not duplicate full agent instructions in these files — link to nested `AGENTS.md` instead.

**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
