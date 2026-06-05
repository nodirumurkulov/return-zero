"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import Image from "next/image";

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
import type { Shop } from "@/lib/shops";
import { cn } from "@/lib/utils";

function shopInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ShopAvatar({
  shop,
  className,
  textClassName,
}: {
  shop: Shop;
  className?: string;
  textClassName?: string;
}) {
  if (shop.logoSrc) {
    return (
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary",
          className,
        )}
      >
        <Image
          src={shop.logoSrc}
          alt=""
          fill
          className="object-cover"
          sizes="32px"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
        className,
      )}
    >
      <span className={cn("font-semibold", textClassName)}>
        {shopInitials(shop.name)}
      </span>
    </div>
  );
}

export function ShopSwitcher({
  shops,
  activeShopId,
  switchingEnabled = false,
}: {
  shops: Shop[];
  activeShopId?: string;
  switchingEnabled?: boolean;
}) {
  const { isMobile } = useSidebar();
  const activeShop =
    shops.find((shop) => shop.id === activeShopId) ?? shops[0];

  if (!activeShop) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <ShopAvatar shop={activeShop} className="size-8" textClassName="text-xs" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeShop.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeShop.plan}
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
            {shops.map((shop) => {
              const isActive = shop.id === activeShop.id;
              return (
                <DropdownMenuItem
                  key={shop.id}
                  disabled={!switchingEnabled || isActive}
                  className="gap-2 p-2"
                >
                  <ShopAvatar
                    shop={shop}
                    className="size-6 rounded-md border border-border bg-background"
                    textClassName="text-[10px]"
                  />
                  <span className="flex-1">{shop.name}</span>
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
