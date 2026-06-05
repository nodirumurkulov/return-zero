# Layout

Shell chrome for authenticated pages: shadcn sidebar navigation, global search, and account sign-out.

## Components

| Component | Role |
|-----------|------|
| `AppShell` | `SidebarProvider` + nav + `GlobalSearch` wrapper used in root layout |
| `GlobalSearch` | ⌘K palette for products and incidents |

## Usage

```tsx
<AppShell user={shellUser} searchTargets={targets}>
  {children}
</AppShell>
```

`AppShell` is a client component (`usePathname`, sidebar state).

## Notes

- Auth is enforced by middleware in `frontend/proxy.ts`, not inside `AppShell`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)
