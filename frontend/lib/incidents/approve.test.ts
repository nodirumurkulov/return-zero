import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { approveIncidentActions, listLowRiskProposedActionIds } from "./approve";

type QueryResult = { data: unknown; error: { message: string } | null };

function chainMock(responses: QueryResult[]) {
  const queue = [...responses];
  const from = vi.fn(() => {
    const result = queue.shift() ?? { data: null, error: null };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      update: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      then: (
        onfulfilled?: (v: QueryResult) => unknown,
        onrejected?: (e: unknown) => unknown,
      ) => Promise.resolve(result).then(onfulfilled, onrejected),
    };
    return builder;
  });
  const supabase = { from } as unknown as SupabaseClient;
  return { supabase, from };
}

describe("listLowRiskProposedActionIds", () => {
  it("returns ids for low-risk proposed actions", async () => {
    const { supabase } = chainMock([
      { data: [{ id: "low-1" }, { id: "low-2" }], error: null },
    ]);
    const ids = await listLowRiskProposedActionIds(supabase, "inc-1");
    expect(ids).toEqual(["low-1", "low-2"]);
  });
});

describe("approveIncidentActions", () => {
  it("returns zero when no action ids", async () => {
    const { supabase, from } = chainMock([]);
    const result = await approveIncidentActions(supabase, "inc-1", [], "user@test");
    expect(result).toEqual({ approved: 0 });
    expect(from).toHaveBeenCalledTimes(0);
  });

  it("updates actions and incident through monitoring", async () => {
    const { supabase, from } = chainMock([
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);
    const result = await approveIncidentActions(supabase, "inc-1", ["a1"], "user@test");
    expect(result).toEqual({ approved: 1 });
    expect(from).toHaveBeenCalled();
  });

  it("throws when action update fails", async () => {
    const { supabase } = chainMock([{ data: null, error: { message: "db error" } }]);
    await expect(
      approveIncidentActions(supabase, "inc-1", ["a1"], "user@test"),
    ).rejects.toThrow("db error");
  });
});
