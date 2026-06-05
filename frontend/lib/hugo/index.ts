import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getIncidentDetail, type Incident } from "@/lib/incidents";
import { postSlackMessage } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import { runHugoApproval, runHugoInvestigation } from "./actions";
import {
  buildCatalogContext,
  buildIncidentDetailContext,
  buildOpenIncidentsContext,
  formatIncidentLine,
  resolveIncident,
  wantsCatalog,
} from "./context";
import { classifyHugoIntent } from "./intent";
import { generateChatReply, generateDataReply } from "./reply";

export type HugoMention = {
  prompt: string;
  channel: string;
  threadTs?: string;
  userName?: string;
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

async function answerDataQuery(
  supabase: SupabaseClient,
  mention: HugoMention,
  incidentReference: string | null | undefined,
): Promise<string> {
  const parts = [await buildOpenIncidentsContext(supabase)];

  const ref = (incidentReference ?? "").trim();
  if (ref) {
    const { match } = await resolveIncident(supabase, ref);
    if (match) {
      const detail = await getIncidentDetail(supabase, match.id);
      if (detail) parts.push(buildIncidentDetailContext(detail));
    }
  }

  if (wantsCatalog(mention.prompt)) {
    parts.push(await buildCatalogContext(supabase));
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
    const intent = await classifyHugoIntent(mention.prompt);

    if (intent.intent === "investigate" || intent.intent === "approve") {
      const verb = intent.intent;
      const { match, candidates } = await resolveIncident(supabase, intent.incident_reference);
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
      await post(await answerDataQuery(supabase, mention, intent.incident_reference));
      return;
    }

    await post(await generateChatReply(mention.prompt));
  } catch (err) {
    console.error("[Hugo] handleHugoMention failed:", err);
    await post("Sorry, something went wrong handling that. Please try again in a moment.");
  }
}
