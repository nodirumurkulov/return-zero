import { OrdersFeed } from "@/components/orders/OrdersFeed";
import { requireOrganizationId } from "@/lib/organizations";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The orders stream begins at the live-window start derived from the uploaded
// data (last 3 months); Start aligns the replay clock to the same point so
// detection runs as orders arrive.
export default async function OrdersPage() {
  const supabase = await createClient();
  const organizationId = await requireOrganizationId(supabase);
  const store = getStore(supabase);
  const bounds = await store.orders.bounds({ organizationId });
  const start = bounds.streamStart;
  const initialOrders = await store.orders.list({
    organizationId,
    after: `${start}T00:00:00Z`,
    limit: 30,
  });

  return <OrdersFeed startDate={start} dataEnd={bounds.dataEnd} initialOrders={initialOrders} />;
}
