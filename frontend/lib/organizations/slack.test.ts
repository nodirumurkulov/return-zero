import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { resolveOrganizationIdForSlackTeam } from "./slack";

function mockSupabase(data: { id: string } | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("resolveOrganizationIdForSlackTeam", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers SLACK_ORGANIZATION_ID env", async () => {
    vi.stubEnv("SLACK_ORGANIZATION_ID", "env-org-id");
    const result = await resolveOrganizationIdForSlackTeam(mockSupabase(null), "T123");
    expect(result).toBe("env-org-id");
  });

  it("looks up slack_team_id when env unset", async () => {
    vi.stubEnv("SLACK_ORGANIZATION_ID", "");
    const result = await resolveOrganizationIdForSlackTeam(
      mockSupabase({ id: "db-org-id" }),
      "T123",
    );
    expect(result).toBe("db-org-id");
  });

  it("returns null when team unmapped", async () => {
    vi.stubEnv("SLACK_ORGANIZATION_ID", "");
    const result = await resolveOrganizationIdForSlackTeam(mockSupabase(null), "T999");
    expect(result).toBeNull();
  });
});
