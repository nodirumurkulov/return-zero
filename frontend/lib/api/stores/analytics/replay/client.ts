import type { z } from "zod";

import { replayBodySchema } from "@/lib/stores/analytics/replay/replay-request";
import {
  replayAdvanceResponseSchema,
  replayOrdersResponseSchema,
} from "@/lib/stores/analytics/replay/replay-response";
import type { OrderFeedItem } from "@/types/orders";

import { apiClient } from "../../../client";

export type AdvanceReplayInput = {
  readonly advanceDays?: number;
  readonly reset?: boolean;
};

export type AdvanceReplayResult = {
  readonly cursor: string | null;
  readonly previousCursor: string | null;
  readonly atEnd: boolean;
  readonly created: number;
  readonly reset: boolean;
  readonly breaches?: {
    readonly created: ReadonlyArray<{ title: string; severity: string }>;
  };
  readonly forecast?: {
    readonly created: ReadonlyArray<{ title: string; severity: string }>;
  };
};

function parseAdvanceResponse(data: z.infer<typeof replayAdvanceResponseSchema>): AdvanceReplayResult {
  if ("error" in data) {
    throw new Error(data.error);
  }

  return {
    cursor: data.cursor,
    previousCursor: data.previous_cursor,
    atEnd: data.at_end,
    created: data.created,
    reset: "reset" in data && data.reset === true,
    breaches: "breaches" in data ? data.breaches : undefined,
    forecast: "forecast" in data ? data.forecast : undefined,
  };
}

export async function postAdvanceReplay(input: AdvanceReplayInput): Promise<AdvanceReplayResult> {
  const body = replayBodySchema.parse({
    advance_days: input.advanceDays,
    reset: input.reset,
  });
  const data = await apiClient("/api/stores/analytics/replay", {
    method: "POST",
    body,
    output: replayAdvanceResponseSchema,
  });
  return parseAdvanceResponse(data);
}

export async function fetchReplayOrders(opts: {
  readonly after: string;
  readonly limit?: number;
}): Promise<{ orders: OrderFeedItem[]; cursor: string | null; dataEnd: string | null }> {
  const data = await apiClient("/api/stores/analytics/replay/orders", {
    query: {
      after: opts.after,
      limit: opts.limit ?? 60,
    },
    output: replayOrdersResponseSchema,
  });

  if ("error" in data) {
    throw new Error(data.error);
  }

  return {
    orders: data.orders,
    cursor: data.cursor,
    dataEnd: data.data_end,
  };
}
