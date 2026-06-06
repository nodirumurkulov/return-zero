import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";
import type { StoreScope } from "@/lib/tenancy/types";

import type { IdMaps } from "./rows";

export class IdMapCache implements IdMaps {
  collections = new Map<string, string>();
  collectionsByTitle = new Map<string, string>();
  products = new Map<string, string>();
  customers = new Map<string, string>();
  variants = new Map<string, string>();
  orders = new Map<string, string>();
  purchase_orders = new Map<string, string>();
  suppliers = new Map<string, string>();
  email_campaigns = new Map<string, string>();
  support_tickets = new Map<string, string>();

  async refreshCollections(
    supabase: SupabaseClient<Database>,
    scope: StoreScope,
  ): Promise<void> {
    const pageSize = 1000;
    this.collections.clear();
    this.collectionsByTitle.clear();

    const loadPage = async (offset: number): Promise<void> => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, external_id, title")
        .eq("organization_id", scope.organizationId)
        .eq("store_id", scope.storeId)
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(`refreshCollections: ${error.message}`);
      if (!data?.length) return;
      for (const row of data) {
        this.collections.set(String(row.external_id), String(row.id));
        if (row.title) this.collectionsByTitle.set(String(row.title), String(row.id));
      }
      if (data.length >= pageSize) await loadPage(offset + pageSize);
    };

    await loadPage(0);
  }
}
