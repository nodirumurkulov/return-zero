"use client";

import { LayoutGrid, LogOut, Search, Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const NAV = [
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
  searchSlot,
}: {
  children: React.ReactNode;
  user: ShellUser;
  searchSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const displayName = user.name ?? user.email ?? "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border p-5">
            <p className="text-lg font-semibold tracking-tight">Pretty Fly</p>
            <p className="text-xs text-muted-foreground">Resolve · Commerce IR</p>
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
            <div className="mb-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-background px-3 py-2">
              <span className="size-2 animate-pulse rounded-full bg-sev-low" />
              <span className="text-xs text-muted-foreground">Agents monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/20 text-sm font-medium text-primary">
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

        <SidebarInset>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              {searchSlot ?? (
                <Input
                  placeholder="Search products or incidents…"
                  className="pl-9"
                  disabled
                />
              )}
            </div>
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
