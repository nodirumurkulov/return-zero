import type { Enums } from "@/lib/supabase/db";

export type StorePlatform = Enums<"store_platform">;
export type StoreConnectionStatus = Enums<"store_connection_status">;

export type StoreScope = {
  organizationId: string;
  storeId: string;
};

export type OrganizationSummary = {
  id: string;
  name: string;
};

export type StoreSummary = {
  id: string;
  label: string | null;
  platform: StorePlatform;
  status: StoreConnectionStatus;
};

export type AppTenancy = {
  organization: OrganizationSummary;
  stores: StoreSummary[];
  activeStore: StoreSummary;
  scope: StoreScope;
};

export type TenancyResolveOpts = {
  organizationId?: string;
};

export type TenancyScopeOpts = {
  organizationId?: string;
  storeId?: string;
};

export type TenancyListStoresOpts = {
  organizationId?: string;
};

export type TenancySetActiveStoreOpts = {
  storeId: string;
  organizationId?: string;
};

export type StoreScopeResult =
  | { ok: true; scope: StoreScope }
  | { ok: false; error: string };
