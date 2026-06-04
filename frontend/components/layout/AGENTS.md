# AGENTS.md — components/layout

`AppShell` — shadcn `Sidebar` nav, header search slot, Supabase sign-out. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Best practices

- Shell stays **presentational** — nav/auth chrome only; never add data fetching or domain types here.

## Rules

- Client component (`usePathname`, `SidebarProvider`, `TooltipProvider`).
- No data fetching; auth enforced in `proxy.ts`.
- Sign-out via server action `signOut` from `@/app/auth/actions`.
