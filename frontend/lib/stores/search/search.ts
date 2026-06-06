import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { SearchError } from "./errors";
import type { SearchListOpts, SearchTarget } from "./types";

export class Search {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(opts: SearchListOpts): Promise<SearchTarget[]> {
    const targets = await this.#loadTargets(opts.scope);
    if (!opts.query?.trim()) return targets;
    const q = opts.query.trim().toLowerCase();
    return targets.filter((t) => t.label.toLowerCase().includes(q));
  }

  async #loadTargets(scope: StoreScope): Promise<SearchTarget[]> {
    const { organizationId, storeId } = scope;
    const [productsRes, incidentsRes] = await Promise.all([
      this.supabase
        .from("products")
        .select("id, title")
        .eq("organization_id", organizationId)
        .eq("store_id", storeId)
        .order("title", { ascending: true }),
      this.supabase
        .from("incidents")
        .select("id, title")
        .eq("organization_id", organizationId)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false }),
    ]);

    if (productsRes.error) throw new SearchError(productsRes.error.message);
    if (incidentsRes.error) throw new SearchError(incidentsRes.error.message);

    const products: SearchTarget[] = (productsRes.data ?? []).map((row) => ({
      id: row.id,
      label: row.title ?? row.id,
      href: `/catalog/${row.id}`,
      kind: "product",
    }));

    const incidents: SearchTarget[] = (incidentsRes.data ?? []).map((row) => ({
      id: row.id,
      label: row.title,
      href: `/incidents/${row.id}`,
      kind: "incident",
    }));

    return [...products, ...incidents];
  }
}
