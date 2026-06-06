import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { getProductMarketingContext } from "@/lib/stores/metrics";
import type { StoreScope } from "@/lib/tenancy/types";
import type { AgentSupabase } from "../types";

export async function fetchMarketingContext(
  supabase: AgentSupabase,
  scope: StoreScope,
  productId: string,
) {
  return getProductMarketingContext(supabase, scope, productId);
}

export function createMarketingTools(supabase: AgentSupabase, scope: StoreScope) {
  return {
    getCampaignAttribution: tool({
      description:
        "Fetch Meta ad campaign attribution, spend, revenue, ROAS, and campaigns below alarm threshold",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => fetchMarketingContext(supabase, scope, productId),
    }),
  };
}
