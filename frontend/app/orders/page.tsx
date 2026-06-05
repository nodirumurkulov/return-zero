import { OrdersFeed } from "@/components/orders/OrdersFeed";
import { REPLAY_START, streamEndDate, streamStartDate } from "@/lib/detection/replay";
import { listIncomingOrders } from "@/lib/orders/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The stream begins at the history end (the live data's last day) and runs forward
// to the staging end as orders are ingested. Start drives the ingest + detection.
export default async function OrdersPage() {
  const supabase = await createClient();
  const [startDate, dataEnd] = await Promise.all([
    streamStartDate(supabase),
    streamEndDate(supabase),
  ]);
  const start = startDate ?? REPLAY_START;
  const initialOrders = await listIncomingOrders(supabase, { after: `${start}T00:00:00Z`, limit: 30 });

  return <OrdersFeed startDate={start} dataEnd={dataEnd} initialOrders={initialOrders} />;
}
