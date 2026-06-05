import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { loadBusinessProfile } from "@/lib/settings/queries";
import type { AgentSupabase } from "../types";

export function createBusinessContextTools(supabase: AgentSupabase, organizationId: string) {
  return {
    getBusinessProfile: tool({
      description:
        "The store's operating context: primary goal (growth/margin/cash), hero product ids, target margin %, min ROAS, lead time and buffer days. Use this to weight and cost the recommendations.",
      inputSchema: z.object({}),
      execute: async () => {
        const profile = await loadBusinessProfile(supabase, organizationId);
        return {
          primary_goal: profile.primaryGoal,
          hero_product_ids: profile.heroProductIds,
          target_margin_pct: profile.targetMarginPct,
          min_roas: profile.minRoas,
          lead_time_days: profile.leadTimeDays,
          buffer_days: profile.bufferDays,
          store_name: profile.storeName,
          platform: profile.platform,
        };
      },
    }),
  };
}
