# AGENTS.md — lib/detection

Breach detection, severity, forecast-risk scan, recovery loop. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `detect.ts` | KPI breach scan → incidents (+ Slack alert on create) |
| `forecast.ts` | Forecast-rule scan (+ Slack alert on create) |
| `severity.ts` | Impact scoring |
| `recover.ts` | Monitoring recovery + baseline capture |
| `schemas.ts` | `recoverBodySchema` for `/api/recover` |

## Dependencies

May import `metrics`, `forecast`, and `slack` (`notifyNewIncident` on incident create). Avoid importing incident UI types.

## Best practices

- Keep detection **deterministic and testable** — pure scoring where possible; side effects only in explicit write paths.
- Schema changes go through `schemas.ts`; remove old body shapes when routes tighten validation.

## Rules

- Cron-capable routes call these modules; keep side effects (DB writes, Slack alerts) here, not in route files.
- Recovery and detect logic stay deterministic where possible.
