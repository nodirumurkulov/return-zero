import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { Incidents } from "./incidents";

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
      single: vi.fn(() => Promise.resolve(result)),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
      then: (
        onfulfilled?: (v: QueryResult) => unknown,
        onrejected?: (e: unknown) => unknown,
      ) => Promise.resolve(result).then(onfulfilled, onrejected),
    };
    return builder;
  });
  const supabase = { from } as unknown as SupabaseClient<Database>;
  return { supabase, from };
}

describe("Incidents", () => {
  describe("listActionIds", () => {
    it("returns ids for low-risk proposed actions", async () => {
      const { supabase } = chainMock([
        { data: [{ id: "low-1" }, { id: "low-2" }], error: null },
      ]);
      const store = new Incidents(supabase);
      const ids = await store.listActionIds({
        incidentId: "inc-1",
        organizationId: "org-1",
        filter: { status: "proposed", riskLevel: "low" },
      });
      expect(ids).toEqual(["low-1", "low-2"]);
    });
  });

  describe("approve", () => {
    it("returns zero when no action ids", async () => {
      const { supabase, from } = chainMock([]);
      const store = new Incidents(supabase);
      const result = await store.approve({
        incidentId: "inc-1",
        actionIds: [],
        approvedByUserId: "user-uuid",
      });
      expect(result).toEqual({ approved: 0 });
      expect(from).toHaveBeenCalledTimes(0);
    });

    it("updates actions and incident through monitoring", async () => {
      const { supabase, from } = chainMock([
        { data: { organization_id: "org-1" }, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ]);
      const store = new Incidents(supabase);
      const result = await store.approve({
        incidentId: "inc-1",
        actionIds: ["a1"],
        approvedByUserId: "user-uuid",
      });
      expect(result).toEqual({ approved: 1 });
      expect(from).toHaveBeenCalled();
    });

    it("throws when incident is missing", async () => {
      const { supabase } = chainMock([{ data: null, error: { message: "not found" } }]);
      const store = new Incidents(supabase);
      await expect(
        store.approve({
          incidentId: "inc-1",
          actionIds: ["a1"],
          approvedByUserId: "user-uuid",
        }),
      ).rejects.toThrow("not found");
    });
  });
});
