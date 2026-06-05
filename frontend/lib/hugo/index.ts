import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getIncidentDetail, type Incident } from "@/lib/incidents";
import { resolveOrganizationIdForSlackTeam } from "@/lib/organizations";
import { fetchSlackThreadMessages, postSlackMessage } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { runHugoApproval, runHugoInvestigation } from "./actions";
import {
  buildCatalogContext,
  buildIncidentDetailContext,
  buildInventoryContext,
  buildOpenIncidentsContext,
  buildThreadTranscript,
  formatIncidentLine,
  resolveIncident,
  resolveThreadIncidentReference,
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

function needsThreadHistory(prompt: string): boolean {
  return /\b(it|that|this|first|second|third|fourth|fifth|one|same)\b/i.test(prompt);
}

function isHistoryScopeError(error: string): boolean {
  return ["missing_scope", "not_in_channel", "channel_not_found"].includes(error);
}

async function answerDataQuery(
  supabase: SupabaseClient<Database>,
  mention: HugoMention,
  organizationId: string,
  incidentReference: string | null | undefined,
  threadTranscript?: string,
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

  if (wantsInventory(`${mention.prompt}\n${threadTranscript ?? ""}`)) {
    parts.push(await buildInventoryContext(supabase, organizationId));
  }

  return generateDataReply(mention.prompt, parts.join("\n\n"), threadTranscript);
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

    const threadRead = mention.threadTs
      ? await fetchSlackThreadMessages({ channel: mention.channel, threadTs: mention.threadTs })
      : null;

    if (threadRead && !threadRead.ok && isHistoryScopeError(threadRead.error) && needsThreadHistory(mention.prompt)) {
      await post(
        'I need Slack thread history access to answer follow-ups like "the second one". Ask an admin to approve the updated Slack scopes, then try again.',
      );
      return;
    }

    const threadTranscript = threadRead?.ok ? buildThreadTranscript(threadRead.messages) : undefined;

    const intent = await classifyHugoIntent(mention.prompt);

    if (intent.intent === "investigate" || intent.intent === "approve") {
      const verb = intent.intent;
      const threadReference = threadTranscript
        ? resolveThreadIncidentReference(mention.prompt, threadTranscript)
        : null;
      const { match, candidates } = await resolveIncident(
        supabase,
        threadReference ?? intent.incident_reference,
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

    if (intent.intent === "data_query") {
      const threadReference = threadTranscript
        ? resolveThreadIncidentReference(mention.prompt, threadTranscript)
        : null;
      await post(
        await answerDataQuery(
          supabase,
          mention,
          organizationId,
          threadReference ?? intent.incident_reference,
          threadTranscript,
        ),
      );
      return;
    }

    await post(await generateChatReply(mention.prompt, threadTranscript));
  } catch (err) {
    console.error("[Hugo] handleHugoMention failed:", err);
    await post("Sorry, something went wrong handling that. Please try again in a moment.");
  }
}
