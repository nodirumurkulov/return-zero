# Detection domain

Scans product metrics for KPI breaches and forecast risks, scores severity, opens incidents, and runs the post-fix recovery loop.

## What's here

| Module | Role |
|--------|------|
| `detect.ts` | Deterministic breach scan → new incidents |
| `forecast.ts` | Forward-looking risk scan |
| `severity.ts` | Impact scoring |
| `recover.ts` | Monitoring recovery projection and auto-resolve |
| `schemas.ts` | Zod body for `/api/recover` |

Triggered by `/api/detect`, `/api/forecast`, and `/api/recover` (often via cron).

## Usage

```typescript
import { detectBreaches } from "@/lib/detection/detect";
import { createServiceClient } from "@/lib/supabase/server";

const result = await detectBreaches(createServiceClient());
```

## Notes

- May import types from `metrics` and `forecast`; keep free of `incidents` UI concerns.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
