# AGENTS.md — lib/stores/learn

Post-import baselines and business report. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `learn.ts` | **`Learn`** class — run, baseline, report, seed |
| `types.ts` | Types, Zod schemas, `parseReportSummary` |
| `errors.ts` | `LearnError` |
| `index.ts` | Barrel |

## Public API

```typescript
import { getStore } from "@/lib/stores/server";

const { learn } = getStore(supabase);
await learn.run({ organizationId });
await learn.baseline({ organizationId });
await learn.report({ organizationId });
await learn.seed({ organizationId });
```
