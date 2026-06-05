import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { SearchTarget } from "./types";

export type { SearchTarget } from "./types";

export async function listSearchTargets(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<SearchTarget[]> {
  const [productsRes, incidentsRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, title")
      .eq("organization_id", organizationId)
      .order("title", { ascending: true }),
    supabase
      .from("incidents")
      .select("id, title")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (incidentsRes.error) throw new Error(incidentsRes.error.message);

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
