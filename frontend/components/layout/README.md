# Layout

Shell chrome for authenticated pages: shadcn sidebar navigation, header search slot, and account sign-out.

## Components

| Component | Role |
|-----------|------|
| `AppShell` | `SidebarProvider` + nav + header wrapper used in root layout |

## Usage

```tsx
<AppShell user={shellUser} searchSlot={optionalSlot}>
  {children}
</AppShell>
```

`AppShell` is a client component (`usePathname`, sidebar state).

## Notes

- Auth is enforced by middleware in `frontend/proxy.ts`, not inside `AppShell`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)
