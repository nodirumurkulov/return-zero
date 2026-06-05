import type { AgentSupabase } from "./types";

const MAX_ORDER_IDS = 500;

export async function orderIdsForProduct(
  supabase: AgentSupabase,
  productId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("line_items")
    .select("order_id")
    .eq("product_id", productId);

  const ids = [
    ...new Set(
      (data ?? [])
        .map((row) => row.order_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  return ids.slice(0, MAX_ORDER_IDS);
}

/** UTM campaigns tied to orders that include this product (for meta ads scoping). */
export async function campaignNamesForProduct(
  supabase: AgentSupabase,
  productId: string,
): Promise<string[]> {
  const orderIds = await orderIdsForProduct(supabase, productId);
  if (orderIds.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("utm_campaign")
    .in("order_id", orderIds);

  return [
    ...new Set(
      (orders ?? [])
        .map((row) => row.utm_campaign)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
}
