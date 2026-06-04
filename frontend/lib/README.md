# Lib

Server-side and shared logic, organized by domain. Import from `@/lib/<domain>`.

| Module | Role |
|--------|------|
| [`incidents/`](incidents/) | Incidents, actions, queries |
| [`catalog/`](catalog/) | Products, thresholds, health |
| [`metrics/`](metrics/) | KPI engine and time series |
| [`forecast/`](forecast/) | Deterministic forecasts |
| [`detection/`](detection/) | Breach detection and recovery |
| [`api/`](api/) | HTTP parsing helpers |
| [`supabase/`](supabase/) | Supabase clients |

Top-level files: `agents.ts`, `llm.ts`, `slack.ts`, etc.

Agents: [AGENTS.md](AGENTS.md).
