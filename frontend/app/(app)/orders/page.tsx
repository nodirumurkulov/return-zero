import { OrdersFeed } from "@/components/orders/OrdersFeed";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

// The orders stream begins at the live-window start derived from the uploaded
// data (last 3 months); Start aligns the replay clock to the same point so
// detection runs as orders arrive.
export default async function OrdersPage() {
  const supabase = await createClient();
  const scope = await getStoreScope();
  const store = getStore(supabase);
  const bounds = await store.orders.bounds({ scope });
  const start = bounds.streamStart;
  const initialOrders = await store.orders.list({
    scope,
    after: `${start}T00:00:00Z`,
    limit: 30,
  });

  return <OrdersFeed startDate={start} dataEnd={bounds.dataEnd} initialOrders={initialOrders} />;
}
