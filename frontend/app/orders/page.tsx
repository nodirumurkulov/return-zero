import { OrdersFeed } from "@/components/orders/OrdersFeed";
import { dataEndDate, REPLAY_START } from "@/lib/detection/replay";
import { listIncomingOrders } from "@/lib/orders/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The orders stream always begins at the baseline split (2025-12-01) and runs
// forward; Start aligns the replay clock to the same point so detection runs as
// orders arrive.
export default async function OrdersPage() {
  const supabase = await createClient();
  const [initialOrders, dataEnd] = await Promise.all([
    listIncomingOrders(supabase, { after: `${REPLAY_START}T00:00:00Z`, limit: 30 }),
    dataEndDate(supabase),
  ]);

  return <OrdersFeed startDate={REPLAY_START} dataEnd={dataEnd} initialOrders={initialOrders} />;
}
