import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSlackThreadMessages, postSlackMessage } from "@/lib/slack";
import { authorizeSlackAction, type SlackAction } from "@/lib/slack-auth/authorize";
import type { Incident } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { getTenancy, resolveOrganizationIdForSlackTeam } from "@/lib/tenancy/server";
import type { StoreScope } from "@/lib/tenancy/types";
import {
  runHugoApproval,
  runHugoInvestigation,
  runHugoReopen,
  runHugoSnooze,
} from "./actions";
import {
  buildCatalogContext,
  buildDeepProductContext,
  buildIncidentDetailContext,
  buildInventoryContext,
  buildOpenIncidentsContext,
  buildThreadTranscript,
  formatIncidentLine,
  resolveIncident,
  resolveThreadIncidentReference,
  wantsCatalog,
  wantsDeepProductContext,
  wantsInventory,
} from "./context";
import { classifyHugoIntent } from "./intent";
import { generateChatReply, generateDataReply } from "./reply";

export type HugoMention = {
  prompt: string;
  channel: string;
  threadTs?: string;
  userName?: string;
  userId?: string;
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

export function needsThreadHistory(prompt: string): boolean {
  const clean = prompt.trim();
  if (/\b(first|second|third|fourth|fifth)\b/i.test(clean)) return true;

  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  return wordCount <= 8 && /\b(it|that|this|one|same)\b/i.test(clean);
}

function isHistoryScopeError(error: string): boolean {
  return ["missing_scope", "not_in_channel", "channel_not_found"].includes(error);
}

function confirmationBlocks(action: "resolve" | "reject", incident: Incident): object[] {
  const label = action === "resolve" ? "Mark resolved" : "Reject proposed fixes";
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

async function authorizeOrReply(
  supabase: SupabaseClient<Database>,
  mention: HugoMention,
  organizationId: string,
  action: SlackAction,
  post: (text: string) => Promise<void>,
): Promise<boolean> {
  const authorization = await authorizeSlackAction(supabase, {
    organizationId,
    slackUserId: mention.userId,
    action,
  });

  if (authorization.allowed) return true;

  await post(authorization.reason);
  return false;
}

async function answerDataQuery(
  supabase: SupabaseClient<Database>,
  mention: HugoMention,
  scope: StoreScope,
  incidentReference: string | null | undefined,
  threadTranscript?: string,
): Promise<string> {
  const parts = [await buildOpenIncidentsContext(supabase, scope)];

  const ref = (incidentReference ?? "").trim();
  const resolvedIncident = ref ? (await resolveIncident(supabase, ref, scope)).match : null;

  if (resolvedIncident) {
    const detail = await getStore(supabase).incidents.getDetail({
      id: resolvedIncident.id,
      scope,
    });
    if (detail) {
      parts.push(buildIncidentDetailContext(detail));
    }
  }

  if (wantsCatalog(mention.prompt)) {
    parts.push(await buildCatalogContext(supabase, scope));
  }

  if (wantsInventory(`${mention.prompt}\n${threadTranscript ?? ""}`)) {
    parts.push(await buildInventoryContext(supabase, scope));
  }

  if (wantsDeepProductContext(`${mention.prompt}\n${threadTranscript ?? ""}`)) {
    const deepContext = await buildDeepProductContext(supabase, scope, resolvedIncident?.id);
    if (deepContext) parts.push(deepContext);
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

    const scope = await getTenancy(supabase).getStoreScope({ organizationId });

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
      if (!(await authorizeOrReply(supabase, mention, organizationId, verb, post))) {
        return;
      }

      const threadReference = threadTranscript
        ? resolveThreadIncidentReference(mention.prompt, threadTranscript)
        : null;
      const { match, candidates } = await resolveIncident(
        supabase,
        threadReference ?? intent.incident_reference,
        scope,
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
      if (!(await authorizeOrReply(supabase, mention, organizationId, verb, post))) {
        return;
      }

      const threadReference = threadTranscript
        ? resolveThreadIncidentReference(mention.prompt, threadTranscript)
        : null;
      const { match, candidates } = await resolveIncident(
        supabase,
        threadReference ?? intent.incident_reference,
        scope,
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
      const threadReference = threadTranscript
        ? resolveThreadIncidentReference(mention.prompt, threadTranscript)
        : null;
      await post(
        await answerDataQuery(
          supabase,
          mention,
          scope,
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
