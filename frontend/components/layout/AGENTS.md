# AGENTS.md — components/layout

`AppShell` — sidebar nav, header, Clerk `UserButton`. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Best practices

- Shell stays **presentational** — nav/auth chrome only; never add data fetching or domain types here.

## Rules

- Client component (`usePathname`, `useUser`).
- No data fetching; auth enforced in `proxy.ts`.
