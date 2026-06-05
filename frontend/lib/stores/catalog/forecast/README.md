# Forecast domain

Deterministic time-series forecasting for product metrics. Same inputs always yield the same outputs (no LLM).

## What's here

| File | Purpose |
|------|---------|
| `methods.ts` | Trend, EWMA, seasonal helpers |
| `product.ts` | Product-level forecast entry points |

Used by detection forecast rules and the forecasting investigation agent.

## Usage

```typescript
import { forecastForProduct } from "@/lib/stores/analytics/forecast/product";
```

## Notes

- Pure functions where possible; no Supabase imports in method cores unless wrapped at call site.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
