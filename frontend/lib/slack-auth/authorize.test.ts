import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import type { TypedSupabaseClient } from "@/lib/supabase/db";

import { authorizeSlackAction } from "./authorize";

type QueryBuilder = {
  select: () => QueryBuilder;
  eq: () => QueryBuilder;
  maybeSingle: () => Promise<QueryResult>;
};

type QueryResult = {
  data: {
    user_id: string;
    role: Database["public"]["Enums"]["organization_role"];
  } | null;
  error: { message: string } | null;
};

function mockSupabase(result: QueryResult): TypedSupabaseClient {
  const builder: QueryBuilder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve(result),
  };

  return {
    from: () => builder,
  } as unknown as TypedSupabaseClient;
}

describe("authorizeSlackAction", () => {
  it("allows linked owners and admins to run mutating Hugo actions", async () => {
    const owner = await authorizeSlackAction(
      mockSupabase({
        data: { user_id: "user-1", role: "owner" },
        error: null,
      }),
      { organizationId: "org-1", slackUserId: "U1", action: "approve" },
    );

    const admin = await authorizeSlackAction(
      mockSupabase({
        data: { user_id: "user-2", role: "admin" },
        error: null,
      }),
      { organizationId: "org-1", slackUserId: "U2", action: "resolve" },
    );

    expect(owner).toEqual({ allowed: true, userId: "user-1", role: "owner" });
    expect(admin).toEqual({ allowed: true, userId: "user-2", role: "admin" });
  });

  it("denies linked members for mutating Hugo actions", async () => {
    const result = await authorizeSlackAction(
      mockSupabase({
        data: { user_id: "user-3", role: "member" },
        error: null,
      }),
      { organizationId: "org-1", slackUserId: "U3", action: "reject" },
    );

    expect(result).toEqual({
      allowed: false,
      reason: "You need an owner or admin Resolve role to do that from Slack.",
    });
  });

  it("denies unlinked Slack users for mutating Hugo actions", async () => {
    const result = await authorizeSlackAction(
      mockSupabase({ data: null, error: null }),
      { organizationId: "org-1", slackUserId: "U4", action: "investigate" },
    );

    expect(result).toEqual({
      allowed: false,
      reason: "Link your Slack account in Resolve before running actions from Slack.",
    });
  });

  it("allows read-only Hugo intents without a linked member", async () => {
    const result = await authorizeSlackAction(
      mockSupabase({ data: null, error: null }),
      { organizationId: "org-1", slackUserId: "U5", action: "data_query" },
    );

    expect(result).toEqual({ allowed: true });
  });
});
