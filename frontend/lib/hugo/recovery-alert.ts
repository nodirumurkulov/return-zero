import type { SupabaseClient } from "@supabase/supabase-js";

import { postOrgSlackBlocks } from "@/lib/slack";
import type { Incident } from "@/lib/stores/incidents/types";
import type { Database } from "@/lib/supabase/database.types";

export type RecoveryMilestone = {
  incident: Incident;
  previousPct: number;
  currentPct: number;
  milestone: 50 | 100;
};

function crossedMilestone(previousPct: number, currentPct: number): 50 | 100 | null {
  if (previousPct < 100 && currentPct >= 100) return 100;
  if (previousPct < 50 && currentPct >= 50) return 50;
  return null;
}

export function recoveryMilestoneFor(
  incident: Incident,
  previousPct: number,
  currentPct: number,
): RecoveryMilestone | null {
  const milestone = crossedMilestone(previousPct, currentPct);
  return milestone ? { incident, previousPct, currentPct, milestone } : null;
}

function recoveryBlocks(milestone: RecoveryMilestone, appUrl: string): object[] {
  const title =
    milestone.milestone === 100
      ? `Recovered — ${milestone.incident.title}`
      : `50% recovered — ${milestone.incident.title}`;

  return [
    {
      type: "header",
      text: { type: "plain_text", text: title },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Previous:*\n${Math.round(milestone.previousPct)}%` },
        { type: "mrkdwn", text: `*Current:*\n${Math.round(milestone.currentPct)}%` },
        {
          type: "mrkdwn",
          text: `*KPI:*\n${milestone.incident.monitoring_kpi ?? "Recovery target"}`,
        },
        {
          type: "mrkdwn",
          text: `*Status:*\n${milestone.milestone === 100 ? "Resolved" : "Monitoring"}`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open incident" },
          url: `${appUrl}/incidents/${milestone.incident.id}`,
          action_id: "open_in_app",
        },
      ],
    },
  ];
}

export async function postRecoveryMilestone(
  supabase: SupabaseClient<Database>,
  milestone: RecoveryMilestone,
  appUrl: string,
): Promise<void> {
  const fallback =
    milestone.milestone === 100
      ? `Recovered — ${milestone.incident.title}`
      : `50% recovered — ${milestone.incident.title}`;

  await postOrgSlackBlocks(
    supabase,
    milestone.incident.organization_id,
    recoveryBlocks(milestone, appUrl),
    fallback,
  );
}
