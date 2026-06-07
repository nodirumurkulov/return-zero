import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/stores";
import type { Database } from "@/lib/supabase/database.types";

vi.mock("./investigate-incident", () => ({
  investigateIncident: vi.fn(),
}));

import { investigateIncident } from "./investigate-incident";
import {
  runHugoInvestigation,
  runHugoRejectProposedActions,
  runHugoReopen,
  runHugoResolve,
  runHugoSnooze,
} from "./actions";

type QueryResult = { data: unknown; error: { message: string } | null };

function incident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "inc-1",
    organization_id: "org-1",
    store_id: "store-1",
    title: "Return rate spike",
    status: "fix_proposed",
    severity: "high",
    impact_amount: 1000,
    impact_label: null,
    product_id: "prod-1",
    affected_kpi_keys: ["return_rate"],
    root_cause: null,
    root_cause_confidence: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    resolved_at: null,
    investigation_started_at: null,
    fix_proposed_at: null,
    monitoring_started_at: null,
    monitoring_kpi: null,
    baseline_value: null,
    target_value: null,
    recovery_pct: 0,
    ...overrides,
  };
}

function chainMock(responses: QueryResult[]) {
  const queue = [...responses];
  const updates: unknown[] = [];
  const inserts: unknown[] = [];
  const from = vi.fn(() => {
    const result = queue.shift() ?? { data: null, error: null };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      update: vi.fn((value: unknown) => {
        updates.push(value);
        return builder;
      }),
      insert: vi.fn((value: unknown) => {
        inserts.push(value);
        return builder;
      }),
      single: vi.fn(() => Promise.resolve(result)),
      then: (onfulfilled?: (v: QueryResult) => unknown, onrejected?: (e: unknown) => unknown) =>
        Promise.resolve(result).then(onfulfilled, onrejected),
    };
    return builder;
  });
  return { supabase: { from } as unknown as SupabaseClient<Database>, from, updates, inserts };
}

describe("Hugo Slack action helpers", () => {
  it("returns a concise investigation completion summary", async () => {
    vi.mocked(investigateIncident).mockResolvedValueOnce({
      result: {
        findings: [],
        root_cause:
          "Product e4993b32-a221 has a refund-rate threshold breach: refund rate is 0.096 ratio versus the 0.08 threshold, but it is not a proven SPC anomaly because the confidence interval is wide.",
        root_cause_confidence: 0.6,
        actions: [],
      },
      findings_count: 1,
      actions_count: 4,
      run_id: "run-1",
    });

    const message = await runHugoInvestigation(
      {} as SupabaseClient<Database>,
      incident({
        id: "inc-1",
        title: "Cargo Sweatpants: Refund rate 9.7% (target <=8.0%)",
      }),
    );

    expect(message).toContain("Investigation complete");
    expect(message).toContain("Confidence: 60%");
    expect(message).toContain("1 finding, 4 proposed fixes");
    expect(message).toContain("Likely issue:");
    expect(message).toContain("Review details:");
    expect(message).not.toContain("Root cause");
    expect(message).not.toContain("confidence 6000%");
    expect(message).not.toContain("confidence interval is wide");
  });

  it("resolves an incident", async () => {
    const { supabase, updates, inserts } = chainMock([
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const message = await runHugoResolve(supabase, incident(), { slack_user: "U1" });

    expect(updates[0]).toMatchObject({ status: "resolved" });
    expect(inserts[0]).toMatchObject({ event_type: "resolved" });
    expect(message).toContain("Resolved");
  });

  it("reopens an incident immediately", async () => {
    const { supabase, updates } = chainMock([
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const message = await runHugoReopen(supabase, incident({ status: "resolved" }), {
      slack_user: "U1",
    });

    expect(updates[0]).toEqual({ status: "detected", resolved_at: null });
    expect(message).toContain("Reopened");
  });

  it("records a snooze note without changing incident status", async () => {
    const { supabase, inserts, updates } = chainMock([{ data: null, error: null }]);

    const message = await runHugoSnooze(supabase, incident(), 7, { slack_user: "U1" });

    expect(updates).toHaveLength(0);
    expect(inserts[0]).toMatchObject({ description: "Snoozed from Slack for 7 day(s)" });
    expect(message).toContain("7-day snooze");
  });

  it("rejects proposed actions", async () => {
    const { supabase, updates, inserts } = chainMock([
      { data: [{ id: "a1" }, { id: "a2" }], error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const message = await runHugoRejectProposedActions(supabase, incident(), { slack_user: "U1" });

    expect(updates[0]).toEqual({ status: "rejected" });
    expect(inserts[0]).toMatchObject({ description: "2 proposed action(s) rejected from Slack" });
    expect(message).toContain("Rejected 2 proposed fix action");
  });
});
