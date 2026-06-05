import { OrdersFeed } from "@/components/orders/OrdersFeed";
import { requireOrganizationId } from "@/lib/organizations";
import { createReplay, Replay } from "@/lib/stores/analytics/replay";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The orders stream begins at the live-window start derived from the uploaded
// data (last 3 months); Start aligns the replay clock to the same point so
// detection runs as orders arrive.
export default async function OrdersPage() {
  const supabase = await createClient();
  const organizationId = await requireOrganizationId(supabase);
  const replay = createReplay(supabase);
  const [startDate, dataEnd] = await Promise.all([
    replay.streamStartDate(organizationId),
    replay.dataEndDate(organizationId),
  ]);
  const start = startDate ?? Replay.REPLAY_START;
  const initialOrders = await replay.listIncomingOrders({
    organizationId,
    after: `${start}T00:00:00Z`,
    limit: 30,
  });

  return <OrdersFeed startDate={start} dataEnd={dataEnd} initialOrders={initialOrders} />;
}
