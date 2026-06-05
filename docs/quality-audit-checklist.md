# Quality Audit Runbook

Repeatable checklist for Resolve codebase audits (quarterly or pre-release).

## 1. Automated gates

```bash
cd frontend
bun install
bun run lint && bun run typecheck && bun run check && bun run build
```

With Supabase running:

```bash
bun run db:lint
bun run db:reset && bun run db:test:rls && bun run seed && bun run validate
CI=true bun run e2e
```

## 2. Metrics capture

```bash
rg -l '"use client"' --glob '*.tsx' | wc -l
rg 'createAdminClient' --glob '*.{ts,tsx}' -c | awk -F: '{s+=$2} END {print s}'
find . -name '*.test.ts' -o -name '*.test.tsx' | grep -v node_modules | wc -l
rg 'eslint-disable|@ts-ignore|@ts-expect-error' --glob '*.{ts,tsx}'
```

## 3. Skill-guided review areas

| Area | Skills | Key paths |
|------|--------|-----------|
| Next.js | `nextjs`, `vercel-react-best-practices` | `app/`, `proxy.ts` |
| React/UI | `react-best-practices`, `web-design-guidelines` | `components/` |
| Domain | AGENTS.md hierarchy | `lib/` |
| API/Auth | `supabase` security checklist | `app/api/` |
| Database | `supabase-postgres-best-practices` | `supabase/migrations/` |
| AI | `ai-sdk` | `lib/agents/`, `lib/hugo/` |
| Testing | `javascript-testing-patterns` | `*.test.ts`, `test/integration/` |

## 4. Anti-pattern grep

```bash
rg '\blet\b|\bvar\b' --glob '*.{ts,tsx}'   # should be ~0 in linted paths
rg 'as unknown as|: any\b' --glob '*.{ts,tsx}'
rg 'getServerSideProps|from .next/router' --glob '*.{ts,tsx}'
rg 'fetch\(' components/ --glob '*.tsx'    # client fetch for initial data
```

## 5. Deliverables

1. Update `docs/quality-audit-YYYY-MM.md` with findings
2. Fix critical/high issues in focused PRs
3. Update `docs/api-auth-audit.md` if routes changed
4. Update nearest `AGENTS.md` if conventions drifted
5. Encode new rules in `.cursor/rules/` if patterns repeat

## 6. Success criteria

- All automated gates green (or failures documented with owners)
- No new `eslint-disable` without approval
- Critical/high findings fixed or explicitly deferred with rationale
