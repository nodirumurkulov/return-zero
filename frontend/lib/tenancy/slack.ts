import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Resolve which organization a Slack workspace maps to.
 * Prefers SLACK_ORGANIZATION_ID env (demo/single-workspace), then slack_team_id column.
 */
export async function resolveOrganizationIdForSlackTeam(
  supabase: SupabaseClient<Database>,
  teamId: string | null | undefined,
): Promise<string | null> {
  const fromEnv = process.env.SLACK_ORGANIZATION_ID?.trim();
  if (fromEnv) return fromEnv;

  const normalizedTeamId = teamId?.trim();
  if (!normalizedTeamId) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slack_team_id", normalizedTeamId)
    .maybeSingle();

  if (error) throw new Error(`resolve Slack organization: ${error.message}`);
  return data?.id ?? null;
}

/** Slack channel id (e.g. C01234567) configured for proactive org notifications. */
export async function getOrganizationSlackChannel(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("slack_channel_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) throw new Error(`load Slack channel: ${error.message}`);
  const channel = data?.slack_channel_id?.trim();
  return channel ? channel : null;
}

/**
 * Resolve where proactive Slack messages should post.
 * Prefers the org channel, then SLACK_DEFAULT_CHANNEL env, else null (webhook fallback).
 */
export function resolveSlackDeliveryChannel(orgChannelId: string | null | undefined): string | null {
  const fromOrg = orgChannelId?.trim();
  if (fromOrg) return fromOrg;

  const fromEnv = process.env.SLACK_DEFAULT_CHANNEL?.trim();
  return fromEnv ? fromEnv : null;
}

export async function resolveOrganizationSlackDeliveryChannel(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string | null> {
  const orgChannel = await getOrganizationSlackChannel(supabase, organizationId);
  return resolveSlackDeliveryChannel(orgChannel);
}
