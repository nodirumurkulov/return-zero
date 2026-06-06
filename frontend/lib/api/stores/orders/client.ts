import { apiClient } from "@/lib/api/client";
import {
  advanceBodySchema,
  advanceResponseSchema,
  feedResponseSchema,
  type AdvanceBody,
} from "@/lib/stores";

export type AdvanceOrdersInput = AdvanceBody;
export type AdvanceOrdersResult = Extract<
  Awaited<ReturnType<typeof postAdvanceOrders>>,
  { success: true }
>;

export async function postAdvanceOrders(input: AdvanceOrdersInput = {}) {
  const body = advanceBodySchema.parse(input);
  const data = await apiClient("/api/stores/orders/advance", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const parsed = advanceResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid advance response");
  if ("error" in parsed.data) throw new Error(parsed.data.error);
  return parsed.data;
}

export async function fetchOrdersFeed(opts: { after: string; limit?: number }) {
  const params = new URLSearchParams({ after: opts.after });
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  const data = await apiClient(`/api/stores/orders/feed?${params.toString()}`);
  const parsed = feedResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid feed response");
  if ("error" in parsed.data) throw new Error(parsed.data.error);
  return parsed.data;
}

export const postAdvanceReplay = postAdvanceOrders;
export const fetchReplayOrders = fetchOrdersFeed;
export type AdvanceReplayInput = AdvanceOrdersInput;
export type AdvanceReplayResult = AdvanceOrdersResult;
