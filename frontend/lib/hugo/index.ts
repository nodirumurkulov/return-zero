import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getIncidentDetail, type Incident } from "@/lib/incidents";
import { resolveOrganizationIdForSlackTeam } from "@/lib/organizations";
import { postSlackMessage } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  runHugoApproval,
  runHugoInvestigation,
  runHugoReopen,
  runHugoSnooze,
} from "./actions";
import {
  buildCatalogContext,
  buildIncidentDetailContext,
  buildInventoryContext,
  buildOpenIncidentsContext,
  formatIncidentLine,
  resolveIncident,
  wantsCatalog,
  wantsInventory,
} from "./context";
import { classifyHugoIntent } from "./intent";
import { generateChatReply, generateDataReply } from "./reply";

export type HugoMention = {
  prompt: string;
  channel: string;
  threadTs?: string;
  userName?: string;
  teamId?: string;
};

export { classifyHugoIntent } from "./intent";
export { resolveIncident } from "./context";

function disambiguation(action: string, candidates: Incident[]): string {
  if (candidates.length === 0) {
    return `I couldn't find any open incident to ${action}. Ask me to "list incidents" to see what's open.`;
  }
  const lines = candidates.slice(0, 8).map((c) => `- ${formatIncidentLine(c)}`);
  return [
    `Which incident should I ${action}? A few candidates:`,
    ...lines,
    `Reply with the title or the id in brackets, e.g. "${action} ${candidates[0].title}".`,
  ].join("\n");
}

function confirmationBlocks(action: "resolve" | "reject", incident: Incident): object[] {
  const label = action === "resolve" ? "Resolve incident" : "Reject proposed fixes";
  const actionId = action === "resolve" ? "confirm_hugo_resolve" : "confirm_hugo_reject";
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Confirm: *${label}* for "${incident.title}"?`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: `Confirm ${action}` },
          style: action === "resolve" ? "primary" : "danger",
          action_id: actionId,
          value: incident.id,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Cancel" },
          action_id: "cancel_hugo_action",
          value: incident.id,
        },
      ],
    },
  ];
}

async function answerDataQuery(
  supabase: SupabaseClient<Database>,
  mention: HugoMention,
  organizationId: string,
  incidentReference: string | null | undefined,
): Promise<string> {
  const parts = [await buildOpenIncidentsContext(supabase, organizationId)];

  const ref = (incidentReference ?? "").trim();
  if (ref) {
    const { match } = await resolveIncident(supabase, ref, organizationId);
    if (match) {
      const detail = await getIncidentDetail(supabase, match.id, organizationId);
      if (detail) parts.push(buildIncidentDetailContext(detail));
    }
  }

  if (wantsCatalog(mention.prompt)) {
    parts.push(await buildCatalogContext(supabase, organizationId));
  }

  if (wantsInventory(mention.prompt)) {
    parts.push(await buildInventoryContext(supabase, organizationId));
  }

  return generateDataReply(mention.prompt, parts.join("\n\n"));
}

/**
 * Handle an `@hugo` mention end-to-end: classify the intent, gather any needed
 * incident/KPI data, run investigate/approve actions, and post the reply in the
 * Slack thread. Never throws — failures are reported back to the user.
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

    const intent = await classifyHugoIntent(mention.prompt);

    if (intent.intent === "investigate" || intent.intent === "approve") {
      const verb = intent.intent;
      const { match, candidates } = await resolveIncident(
        supabase,
        intent.incident_reference,
        organizationId,
      );
      if (!match) {
        await post(disambiguation(verb, candidates));
        return;
      }

      await post(
        verb === "investigate"
          ? `On it — investigating "${match.title}". I'll post the findings here shortly.`
          : `On it — approving low-risk fixes for "${match.title}"…`,
      );

      const result =
        verb === "investigate"
          ? await runHugoInvestigation(supabase, match)
          : await runHugoApproval(supabase, match, mention.userName ?? "slack-user");
      await post(result);
      return;
    }

    if (["resolve", "reopen", "snooze", "reject"].includes(intent.intent)) {
      const verb = intent.intent;
      const { match, candidates } = await resolveIncident(
        supabase,
        intent.incident_reference,
        organizationId,
      );
      if (!match) {
        await post(disambiguation(verb, candidates));
        return;
      }

      if (verb === "resolve" || verb === "reject") {
        await postSlackMessage({
          channel: mention.channel,
          threadTs: mention.threadTs,
          text: `Please confirm ${verb} for "${match.title}".`,
          blocks: confirmationBlocks(verb, match),
        });
        return;
      }

      const actor = { slack_user: mention.userName ?? "slack-user" };
      const result =
        verb === "reopen"
          ? await runHugoReopen(supabase, match, actor)
          : await runHugoSnooze(supabase, match, intent.duration_days ?? 7, actor);
      await post(result);
      return;
    }

    if (intent.intent === "data_query") {
      await post(await answerDataQuery(supabase, mention, organizationId, intent.incident_reference));
      return;
    }

    await post(await generateChatReply(mention.prompt));
  } catch (err) {
    console.error("[Hugo] handleHugoMention failed:", err);
    await post("Sorry, something went wrong handling that. Please try again in a moment.");
  }
}
