import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type MemberRole = Database["public"]["Enums"]["organization_role"];

export type SlackAction =
  | "chat"
  | "data_query"
  | "snooze"
  | "investigate"
  | "approve"
  | "resolve"
  | "reject"
  | "reopen";

export type SlackAuthorization =
  | {
      allowed: true;
      userId?: string;
      role?: MemberRole;
    }
  | { allowed: false; reason: string };

const READ_ONLY_ACTIONS = new Set<SlackAction>(["chat", "data_query", "snooze"]);
const MUTATING_ROLES = new Set<MemberRole>(["owner", "admin"]);

export async function authorizeSlackAction(
  supabase: SupabaseClient<Database>,
  args: {
    organizationId: string;
    slackUserId: string | null | undefined;
    action: SlackAction;
  },
): Promise<SlackAuthorization> {
  if (READ_ONLY_ACTIONS.has(args.action)) {
    return { allowed: true };
  }

  const slackUserId = args.slackUserId?.trim();
  if (!slackUserId) {
    return {
      allowed: false,
      reason: "Slack did not include your user id, so I cannot authorize that action.",
    };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", args.organizationId)
    .eq("slack_user_id", slackUserId)
    .maybeSingle();

  if (error) {
    return { allowed: false, reason: `Could not verify your Resolve role: ${error.message}` };
  }

  if (!data) {
    return {
      allowed: false,
      reason: "Link your Slack account in Resolve before running actions from Slack.",
    };
  }

  if (!MUTATING_ROLES.has(data.role)) {
    return {
      allowed: false,
      reason: "You need an owner or admin Resolve role to do that from Slack.",
    };
  }

  return { allowed: true, userId: data.user_id, role: data.role };
}
