# Layout components

Shell chrome for authenticated pages: sidebar navigation, header search slot, and Clerk account menu.

## What's here

| Component | Purpose |
|-----------|---------|
| `AppShell` | Sidebar + header wrapper used in root layout |

Navigation links: Catalog (`/catalog`), Incidents (`/incidents`).

## Usage

```tsx
<AppShell searchSlot={optionalSlot}>{children}</AppShell>
```

`AppShell` is a client component (`usePathname`, `useUser`).

## Notes

- Auth is enforced by Clerk middleware in `frontend/proxy.ts`, not inside `AppShell`.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
