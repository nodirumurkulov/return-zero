import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import {
  getOrganizationSlackChannel,
  resolveOrganizationIdForSlackTeam,
  resolveOrganizationSlackDeliveryChannel,
  resolveSlackDeliveryChannel,
} from "./slack";

function mockSupabase(data: { id: string } | { slack_channel_id: string | null } | null) {
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

describe("resolveSlackDeliveryChannel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the org channel over env default", () => {
    vi.stubEnv("SLACK_DEFAULT_CHANNEL", "CENV");
    expect(resolveSlackDeliveryChannel("CORG")).toBe("CORG");
  });

  it("falls back to SLACK_DEFAULT_CHANNEL", () => {
    vi.stubEnv("SLACK_DEFAULT_CHANNEL", "CENV");
    expect(resolveSlackDeliveryChannel(null)).toBe("CENV");
  });
});

describe("getOrganizationSlackChannel", () => {
  it("returns trimmed slack_channel_id", async () => {
    const channel = await getOrganizationSlackChannel(
      mockSupabase({ slack_channel_id: " C123 " }),
      "org-1",
    );
    expect(channel).toBe("C123");
  });

  it("returns null when unset", async () => {
    const channel = await getOrganizationSlackChannel(
      mockSupabase({ slack_channel_id: null }),
      "org-1",
    );
    expect(channel).toBeNull();
  });
});

describe("resolveOrganizationSlackDeliveryChannel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("combines org lookup with env fallback", async () => {
    vi.stubEnv("SLACK_DEFAULT_CHANNEL", "CENV");
    const channel = await resolveOrganizationSlackDeliveryChannel(
      mockSupabase({ slack_channel_id: null }),
      "org-1",
    );
    expect(channel).toBe("CENV");
  });
});
