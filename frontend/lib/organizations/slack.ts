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
