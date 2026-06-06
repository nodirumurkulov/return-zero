import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { TenancyError } from "./errors";
import type {
  AppTenancy,
  OrganizationSummary,
  StoreScope,
  StoreSummary,
  TenancyListStoresOpts,
  TenancyResolveOpts,
  TenancyScopeOpts,
  TenancySetActiveStoreOpts,
  StoreScopeResult,
} from "./types";

export class Tenancy {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async resolveOrganizationId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      throw new TenancyError("Not authenticated");
    }

    const { data, error } = await this.supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new TenancyError(error.message);
    if (!data?.organization_id) {
      throw new TenancyError("No organization membership found for user");
    }
    return data.organization_id;
  }

  async tryGetStoreScope(opts?: TenancyScopeOpts): Promise<StoreScopeResult> {
    try {
      const scope = await this.getStoreScope(opts);
      return { ok: true, scope };
    } catch (error) {
      const message =
        error instanceof TenancyError ? error.message : "Failed to resolve store scope";
      return { ok: false, error: message };
    }
  }

  async resolve(opts?: TenancyResolveOpts): Promise<AppTenancy> {
    const organizationId = opts?.organizationId ?? (await this.resolveOrganizationId());

    const { data: org, error: orgError } = await this.supabase
      .from("organizations")
      .select("id, name, active_store_id")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      throw new TenancyError(`organizations read failed: ${orgError.message}`);
    }

    const stores = await this.listStores({ organizationId });
    const activeStore = this.resolveActiveStore(stores, org.active_store_id);

    const organization: OrganizationSummary = {
      id: org.id,
      name: org.name,
    };

    return {
      organization,
      stores,
      activeStore,
      scope: {
        organizationId: org.id,
        storeId: activeStore.id,
      },
    };
  }

  async getStoreScope(opts?: TenancyScopeOpts): Promise<StoreScope> {
    const organizationId = opts?.organizationId ?? (await this.resolveOrganizationId());

    if (opts?.storeId) {
      const stores = await this.listStores({ organizationId });
      const store = stores.find((row) => row.id === opts.storeId);
      if (!store) {
        throw new TenancyError("Store not found in organization");
      }
      return { organizationId, storeId: store.id };
    }

    const tenancy = await this.resolve({ organizationId });
    return tenancy.scope;
  }

  async listStores(opts?: TenancyListStoresOpts): Promise<StoreSummary[]> {
    const organizationId = opts?.organizationId ?? (await this.resolveOrganizationId());

    const { data, error } = await this.supabase
      .from("store_connections")
      .select("id, label, platform, status")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new TenancyError(`store_connections list failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      platform: row.platform,
      status: row.status,
    }));
  }

  async setActiveStore(opts: TenancySetActiveStoreOpts): Promise<AppTenancy> {
    const organizationId = opts.organizationId ?? (await this.resolveOrganizationId());

    const stores = await this.listStores({ organizationId });
    const store = stores.find((row) => row.id === opts.storeId);
    if (!store) {
      throw new TenancyError("Store not found in organization");
    }

    const { error } = await this.supabase
      .from("organizations")
      .update({
        active_store_id: opts.storeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId);

    if (error) {
      throw new TenancyError(`organizations update failed: ${error.message}`);
    }

    return this.resolve({ organizationId });
  }

  private resolveActiveStore(
    stores: StoreSummary[],
    activeStoreId: string | null,
  ): StoreSummary {
    if (stores.length === 0) {
      throw new TenancyError("No stores connected for organization");
    }
    if (activeStoreId) {
      const match = stores.find((store) => store.id === activeStoreId);
      if (match) return match;
    }
    return stores[0];
  }
}
