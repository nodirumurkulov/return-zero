"use client";

import { LayoutGrid, LogOut, Search, Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/catalog", label: "Catalog", icon: LayoutGrid },
  { href: "/incidents", label: "Incidents", icon: Siren },
];

export type ShellUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export default function AppShell({
  children,
  user,
  searchSlot,
}: {
  children: React.ReactNode;
  user: ShellUser;
  searchSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const displayName = user.name ?? user.email ?? "Account";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="border-b border-border p-5">
          <p className="text-lg font-semibold tracking-tight">Pretty Fly</p>
          <p className="text-xs text-muted-foreground">Resolve · Commerce IR</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sev-low" />
            <span className="text-xs text-muted-foreground">Agents monitoring</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              {user.email ? (
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            {searchSlot ?? (
              <Input
                placeholder="Search products or incidents…"
                className="pl-9"
                disabled
              />
            )}
          </div>
          <form action={signOut} className="md:hidden">
            <button
              type="submit"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
