"use client";

import { LayoutGrid, LogOut, Receipt, Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { BrandLogo } from "@/components/layout/BrandLogo";
import GlobalSearch from "@/components/layout/GlobalSearch";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SearchTarget } from "@/lib/search";

const NAV = [
  { href: "/orders", label: "Orders", icon: Receipt },
  { href: "/catalog", label: "Catalog", icon: LayoutGrid },
  { href: "/incidents", label: "Incidents", icon: Siren },
] as const;

export type ShellUser = {
  id: string;
  email: string | null;
  name: string | null;
};

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        className={className}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}

export default function AppShell({
  children,
  user,
  searchTargets,
}: {
  children: React.ReactNode;
  user: ShellUser;
  searchTargets: SearchTarget[];
}) {
  const pathname = usePathname();
  const displayName = user.name ?? user.email ?? "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <TooltipProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-pop focus:outline-none focus:ring-3 focus:ring-ring/50"
      >
        Skip to main content
      </a>
      <SidebarProvider>
        <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <BrandLogo />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map(({ href, label, icon: Icon }) => {
                    const active =
                      pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={label}>
                          <Link href={href}>
                            <Icon />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="mb-3 rounded-lg border border-border bg-card p-3 shadow-card">
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full motion-safe:animate-ping rounded-full bg-sev-resolved/50" />
                  <span className="relative inline-flex size-2 rounded-full bg-sev-resolved" />
                </span>
                <span className="text-xs font-semibold text-foreground">Hugo is online</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Watching your KPIs in real time. You&apos;ll hear from it only when something breaks.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary-subtle text-sm font-medium text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </p>
                {user.email ? (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
              <SignOutButton />
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset id="main">
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="relative max-w-md flex-1">
              <GlobalSearch targets={searchTargets} />
            </div>
            <ThemeToggle />
            <div className="md:hidden">
              <SignOutButton />
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
