# AGENTS.md — components/ui

shadcn/ui primitives (`radix-nova`) and thin wrappers. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Best practices

- Primitives stay **generic** — if a badge needs domain enums, pass narrow string unions from parents; do not import `@/lib/*` here.
- Add new shared UI via `bunx shadcn@latest add <name>`; avoid one-off custom CSS components when a shadcn primitive fits.

## Rules

- No business logic, no domain types, no Supabase.
- Domain badges (`SeverityBadge`, `StatusBadge`, `ImpactTag`) compose `Badge` + style maps only.
- `EmptyState` composes shadcn `Empty`; keep the stable `title` / `description` / `action` API for call sites.
- Keep components stateless when possible.
