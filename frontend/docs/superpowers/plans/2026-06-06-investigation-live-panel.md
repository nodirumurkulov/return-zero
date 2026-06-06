# Investigation Live Panel — Design & Plan

**Goal:** A simple UI panel on incident detail that shows **live agent steps** during investigation — whether the user clicked “Trigger Investigation” or detect/replay started it in the background.

**Scope:** In-app only (incident detail page). Slack/Hugo streaming is out of scope for v1.

---

## Problem

Today `POST /api/investigate` blocks until Quant + Operator finish. The button shows “Investigating…” and the page refreshes once at the end. Background runs (detect cron, replay) have **zero** in-app visibility until status flips to `fix_proposed`.

## Success criteria

1. User sees a chronological step list while investigation runs.
2. Opening `/incidents/[id]` mid-run shows steps already completed + current step updating.
3. Steps reflect **real** agent activity (tool calls + phase changes), not a fake progress bar.
4. Panel works for manual trigger **and** background/auto investigate.
5. After completion, panel shows final summary; findings/root cause appear as today.

---

## Architecture

### Data: `investigation_steps` table

Append/update rows per investigation **run** (one run per `investigation_started_at` cycle).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | RLS |
| `incident_id` | uuid | FK |
| `run_id` | uuid | Groups steps for one investigation attempt |
| `step_key` | text | Stable key within run, e.g. `quant:getAnomalyProfile` |
| `agent_name` | text | `Quant Analyst`, `Operator` |
| `label` | text | Human-readable, e.g. “Checking anomaly profile” |
| `status` | enum | `running` \| `done` \| `error` |
| `metadata` | jsonb | Optional tool args summary, error message |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Unique constraint: `(run_id, step_key)`.

RLS: org members can `SELECT`; writes via service role / server only (same as timeline inserts today).

### Server: step emitter in agent pipeline

1. `persistInvestigation` generates `run_id`, writes first step “Investigation started”.
2. Pass `onStep` callback into `runInvestigation` → `runQuantAnalyst` / `runOperator`.
3. Wrap `ToolLoopAgent.generate` with AI SDK step hooks (`onStepFinish` or equivalent in ai v6) to emit:
   - Phase: “Quant Analyst dispatched”
   - Tool: “Calling getAnomalyProfile” → done
   - Phase: “Quant diagnosis complete”
   - Phase: “Operator dispatched”
   - Tool: “Reading business profile” → done
   - Phase: “Proposing actions” → done
4. On success: final step “Investigation complete”. On error: step with `status: error`, incident reverted to `detected`.

All paths that call `persistInvestigation` get steps for free (manual API, detect auto-investigate, Hugo Slack investigate).

### API

- **`GET /api/incidents/[id]/investigation-steps`** — returns `{ run_id, status: 'idle'|'running'|'complete'|'error', steps: [...] }` for the latest run (or active run when incident.status = `investigating`).
- Keep **`POST /api/investigate`** but return immediately after setting `investigating` + first step, **or** return `{ run_id }` and run investigation in `after()` — **preferred:** stay synchronous for v1 simplicity but client polls steps while POST is in flight (works for manual). For background runs, polling alone is enough.

**v1 transport:** React Query poll every **1.5s** while `incident.status === 'investigating'`. No SSE in v1 (add later for snappier manual runs).

### UI: `InvestigationLivePanel`

Location: incident detail right column **above** Timeline (or replaces empty state while investigating).

```
┌─ Hugo is investigating ──────────────── ● Live ┐
│ ✓ Investigation started                        │
│ ✓ Quant Analyst — Checking anomaly profile     │
│ ● Quant Analyst — Reviewing marketing ROAS     │  ← pulsing dot
│ ○ Operator — Waiting…                          │
└────────────────────────────────────────────────┘
```

- Visible when `status === 'investigating'` **or** latest run completed &lt; 5 min ago (collapsible “Last run”).
- Uses existing card/Bot icon patterns from `AgentMonitor`.
- `aria-live="polite"` on step list.
- On transition to `fix_proposed`, stop polling + `router.refresh()` for findings.

### Tool label map

| Tool name | Label |
|-----------|-------|
| `getAnomalyProfile` | Checking anomaly profile |
| `getRoasReallocation` | Reviewing marketing ROAS |
| `getBusinessProfile` | Reading business profile |
| (default) | Calling `{toolName}` |

---

## File map

| Action | Path |
|--------|------|
| Migration + schema | `supabase/schemas/019_investigation_steps.sql`, `migrations/019_...` |
| Step writer | `lib/agents/investigation-steps.ts` |
| Hook agents | `lib/agents/quant-analyst.ts`, `operator.ts`, `run-investigation.ts`, `persist-investigation.ts` |
| API route | `app/api/incidents/[id]/investigation-steps/route.ts` |
| Client hook | `hooks/agents/use-investigation-steps.ts` |
| UI | `components/incidents/InvestigationLivePanel.tsx` |
| Wire UI | `components/incidents/IncidentDetailView.tsx` |
| Tests | `lib/agents/investigation-steps.test.ts`, `InvestigationLivePanel.test.tsx` |

---

## Out of scope (v1)

- SSE streaming
- Catalog/product page live panel
- Slack step mirroring
- Persisted step history beyond latest run in UI (data retained in DB)

---

## Implementation order

1. Migration + types (`bun run db:types`)
2. `investigation-steps.ts` (upsert step helper)
3. Instrument agents with `onStep`
4. GET API route
5. `InvestigationLivePanel` + poll hook
6. Wire into incident detail + update `TriggerInvestigationButton` to show panel immediately
7. Tests + manual verify on detect + manual trigger
