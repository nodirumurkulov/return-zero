# lib/detection/

Breach detection, severity scoring, incident forecast hooks, recovery loop.

## Files

- `detect.ts` — scan metrics, open incidents
- `severity.ts` — deterministic severity (`Severity` type here or in `types` later)
- `forecast.ts` — forecast-driven detection
- `recover.ts` — monitoring recovery projection

Depends on `metrics` and `forecast` modules, not on `incidents` types for core math.
