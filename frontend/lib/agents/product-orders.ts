import type { AgentSupabase } from "./types";

const MAX_ORDER_IDS = 500;

export async function orderIdsForProduct(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("line_items")
    .select("order_id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId);

  const ids = [...new Set((data ?? []).map((row) => row.order_id))];
  return ids.slice(0, MAX_ORDER_IDS);
}

/** UTM campaigns tied to orders that include this product (for meta ads scoping). */
export async function campaignNamesForProduct(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
): Promise<string[]> {
  const orderIds = await orderIdsForProduct(supabase, organizationId, productId);
  if (orderIds.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("utm_campaign")
    .eq("organization_id", organizationId)
    .in("id", orderIds);

  return [
    ...new Set(
      (orders ?? [])
        .map((row) => row.utm_campaign)
        .filter((name): name is string => name != null && name.length > 0),
    ),
  ];
}
