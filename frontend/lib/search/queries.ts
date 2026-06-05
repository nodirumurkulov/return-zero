import type { SupabaseClient } from "@supabase/supabase-js";

import type { SearchTarget } from "./types";

export type { SearchTarget } from "./types";

export async function listSearchTargets(
  supabase: SupabaseClient,
): Promise<SearchTarget[]> {
  const [productsRes, incidentsRes] = await Promise.all([
    supabase.from("products").select("product_id, title").order("title"),
    supabase
      .from("incidents")
      .select("id, title")
      .order("created_at", { ascending: false }),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (incidentsRes.error) throw new Error(incidentsRes.error.message);

  const products: SearchTarget[] = (productsRes.data ?? []).map((row) => ({
    id: row.product_id,
    label: row.title ?? row.product_id,
    href: `/catalog/${row.product_id}`,
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
