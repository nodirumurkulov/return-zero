import "server-only";

import { resolveOrganizationIdForSlackTeam } from "@/lib/organizations";
import { postSlackMessage } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";

import { runHugoSlackAgent } from "./core/agent";
import type { HugoMention } from "./mention";

export type { HugoMention } from "./mention";
export { resolveIncident } from "./context";
export { investigateBodySchema, type InvestigateBody } from "./schemas";
export { runIncidentInvestigation } from "./core/agent";
export type { HugoInvestigationResult, PersistInvestigationResult } from "./types";

/**
 * Handle an `@hugo` Slack mention end-to-end with a single tool-driven agent.
 * Never throws — failures are reported back to the user.
 */
export async function handleHugoMention(mention: HugoMention): Promise<void> {
  const post = (text: string) =>
    postSlackMessage({ channel: mention.channel, text, threadTs: mention.threadTs });

  try {
    const supabase = createAdminClient();
    const organizationId = await resolveOrganizationIdForSlackTeam(supabase, mention.teamId);
    if (!organizationId) {
      await post(
        "This Slack workspace is not linked to an organization. Set SLACK_ORGANIZATION_ID or add slack_team_id on the org.",
      );
      return;
    }

    const { text } = await runHugoSlackAgent(
      { supabase, organizationId },
      {
        prompt: mention.prompt,
        organizationId,
        userName: mention.userName,
      },
    );
    await post(text);
  } catch (err) {
    console.error("[Hugo] handleHugoMention failed:", err);
    await post("Sorry, something went wrong handling that. Please try again in a moment.");
  }
}
