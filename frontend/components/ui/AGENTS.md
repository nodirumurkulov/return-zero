# AGENTS.md — components/ui

Shared primitives (Tailwind + Radix). **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Best practices

- Primitives stay **generic** — if a badge needs domain enums, pass narrow string unions from parents; do not import `@/lib/*` here.

## Rules

- No business logic, no domain types, no Supabase.
- Badges map string enums to styles only (`SeverityBadge`, `StatusBadge`).
- Keep components stateless when possible.
