# AGENTS.md — lib/detection

Breach detection, severity, forecast-risk scan, recovery loop. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `detect.ts` | KPI breach scan → incidents |
| `forecast.ts` | Forecast-rule scan |
| `severity.ts` | Impact scoring |
| `recover.ts` | Monitoring recovery + baseline capture |
| `schemas.ts` | `recoverBodySchema` for `/api/recover` |

## Dependencies

May import `metrics` and `forecast`. Avoid importing incident UI types.

## Rules

- Cron-capable routes call these modules; keep side effects (DB writes) here, not in route files.
- Recovery and detect logic stay deterministic where possible.
