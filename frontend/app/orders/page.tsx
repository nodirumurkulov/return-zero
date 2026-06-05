import { OrdersFeed } from "@/components/orders/OrdersFeed";
import { REPLAY_START, streamEndDate, streamStartDate } from "@/lib/detection/replay-clock";
import { listIncomingOrders } from "@/lib/orders/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The orders stream begins at the history end (stream_start) and runs to the end
// of the staged future. Start advances the replay clock, ingesting staged rows
// into the live tables day by day so detection runs as orders arrive.
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
