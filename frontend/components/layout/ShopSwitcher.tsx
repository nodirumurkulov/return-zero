"use client";

import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useActiveStore, useStores, useSwitchStore } from "@/hooks/tenancy";
import type { StoreSummary } from "@/lib/tenancy";
import { cn } from "@/lib/utils";

function storeDisplayName(store: StoreSummary): string {
  if (store.label) return store.label;
  return store.platform === "mock_csv" ? "Mock store" : "Shopify store";
}

function storeInitials(store: StoreSummary): string {
  return storeDisplayName(store)
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StoreAvatar({
  store,
  className,
  textClassName,
}: {
  store: StoreSummary;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
        className,
      )}
    >
      <span className={cn("font-semibold", textClassName)}>{storeInitials(store)}</span>
    </div>
  );
}

export function ShopSwitcher() {
  const { isMobile } = useSidebar();
  const stores = useStores();
  const activeStore = useActiveStore();
  const { mutate: switchStore, isPending } = useSwitchStore();
  const switchingEnabled = stores.length > 1;

  if (!activeStore) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-auto min-h-10 py-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isPending}
            >
              <StoreAvatar store={activeStore} className="size-7" textClassName="text-[11px]" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{storeDisplayName(activeStore)}</span>
                <span className="truncate text-xs text-muted-foreground capitalize">
                  {activeStore.platform.replace("_", " ")}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Stores
            </DropdownMenuLabel>
            {stores.map((store) => {
              const isActive = store.id === activeStore.id;
              return (
                <DropdownMenuItem
                  key={store.id}
                  disabled={!switchingEnabled || isActive || isPending}
                  className="gap-2 p-2"
                  onClick={() => {
                    if (!isActive) {
                      switchStore(store.id);
                    }
                  }}
                >
                  <StoreAvatar
                    store={store}
                    className="size-6 rounded-md border border-border bg-background"
                    textClassName="text-[10px]"
                  />
                  <span className="flex-1">{storeDisplayName(store)}</span>
                  {isActive ? (
                    <span className="text-xs text-muted-foreground">Active</span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Connect store</div>
              <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
