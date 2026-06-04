# Visual parity checklist (src/ prototype → Resolve frontend)

Side-by-side review against the internal `src/` prototype. Sign off when each row matches.

| Area | Expected (src/) | Implemented | Status |
|------|-----------------|-------------|--------|
| Primary color | Indigo `#6366f1` | `--primary: 239 84% 67%` | ✅ |
| Neutrals | Zinc scale on dark bg | `background` + `card` zinc tokens | ✅ |
| Severity colors | sev-critical/high/medium/low | Tailwind `sev-*` + badges | ✅ |
| Card shadow | shadow-card | `.shadow-card` utility | ✅ |
| Sidebar | Pretty Fly brand, Catalog + Incidents | `AppShell` sidebar nav | ✅ |
| Catalog grid | Product cards with health + KPIs | `ProductCatalogCard` | ✅ |
| Product detail | KPI cards + sparklines | `KpiCard` + `Sparkline` | ✅ |
| Kanban columns | 6 status columns | `IncidentKanban` | ✅ |
| Incident cards | Severity, impact, status | `IncidentCard` | ✅ |
| Typography | Inter, tight headings | Inter via `layout.tsx` | ✅ |
| Spacing | 4px grid, p-4 cards | shadcn card padding | ✅ |

**Reviewers:** Naseem / Avinash — sign off in Linear RUN-40 when demo-ready.

**Notes:** Full pixel-perfect parity depends on `src/` reference files (not committed). Tokens and layout match the spec in RUN-35.
