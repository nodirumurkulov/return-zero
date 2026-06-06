import { describe, expect, it } from "vitest";
import type { Incident } from "@/lib/stores";
import { HUGO_MOCK_STORE_NAME } from "@/lib/tenancy";
import { buildDigestBlocks, summarizeIncidents } from "./digest";

function incident(overrides: Partial<Incident>): Incident {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    organization_id: "00000000-0000-0000-0000-000000000100",
    store_id: "00000000-0000-0000-0000-000000000101",
    title: "Return rate spike",
    status: "detected",
    severity: "high",
    impact_amount: 1234,
    impact_label: null,
    product_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    affected_kpi_keys: ["return_rate"],
    root_cause: null,
    root_cause_confidence: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
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

describe("summarizeIncidents", () => {
  it("returns zero counts for empty input", () => {
    const result = summarizeIncidents([]);
    expect(result.openCount).toBe(0);
    expect(result.totalExposure).toBe(0);
    expect(result.awaitingApproval).toBe(0);
    expect(result.topIncidents).toHaveLength(0);
  });

  it("excludes resolved and canceled incidents from open count", () => {
    const incidents = [
      incident({ id: "a", status: "detected" }),
      incident({ id: "b", status: "resolved" }),
      incident({ id: "c", status: "canceled" }),
      incident({ id: "d", status: "investigating" }),
    ];
    const result = summarizeIncidents(incidents);
    expect(result.openCount).toBe(2);
  });

  it("sums impact_amount for open incidents only", () => {
    const incidents = [
      incident({ id: "a", status: "detected", impact_amount: 1000 }),
      incident({ id: "b", status: "resolved", impact_amount: 9999 }),
      incident({ id: "c", status: "fix_proposed", impact_amount: 500 }),
    ];
    const result = summarizeIncidents(incidents);
    expect(result.totalExposure).toBe(1500);
  });

  it("counts awaiting_approval incidents", () => {
    const incidents = [
      incident({ id: "a", status: "awaiting_approval" }),
      incident({ id: "b", status: "awaiting_approval" }),
      incident({ id: "c", status: "detected" }),
    ];
    const result = summarizeIncidents(incidents);
    expect(result.awaitingApproval).toBe(2);
  });

  it("breaks down open incidents by severity", () => {
    const incidents = [
      incident({ id: "a", severity: "critical", status: "detected" }),
      incident({ id: "b", severity: "critical", status: "investigating" }),
      incident({ id: "c", severity: "high", status: "fix_proposed" }),
      incident({ id: "d", severity: "low", status: "resolved" }),
    ];
    const result = summarizeIncidents(incidents);
    expect(result.bySeverity.critical).toBe(2);
    expect(result.bySeverity.high).toBe(1);
    expect(result.bySeverity.medium).toBe(0);
    expect(result.bySeverity.low).toBe(0);
  });

  it("returns top 5 incidents sorted by impact descending", () => {
    const incidents = Array.from({ length: 7 }, (_, i) =>
      incident({
        id: `id-${i}`,
        status: "detected",
        impact_amount: (i + 1) * 100,
      }),
    );
    const result = summarizeIncidents(incidents);
    expect(result.topIncidents).toHaveLength(5);
    expect(result.topIncidents[0].id).toBe("id-6");
    expect(result.topIncidents[4].id).toBe("id-2");
  });
});

describe("buildDigestBlocks", () => {
  it("returns all-clear message when no open incidents", () => {
    const summary = summarizeIncidents([]);
    const blocks = buildDigestBlocks(HUGO_MOCK_STORE_NAME, summary, "https://app.test");
    expect(blocks).toHaveLength(2);
    const text = JSON.stringify(blocks);
    expect(text).toContain("All clear");
    expect(text).toContain(HUGO_MOCK_STORE_NAME);
  });

  it("returns header + summary + incidents + action button when open incidents exist", () => {
    const incidents = [
      incident({
        id: "a",
        status: "awaiting_approval",
        severity: "critical",
        impact_amount: 50000,
        title: "Stockout",
      }),
      incident({
        id: "b",
        status: "investigating",
        severity: "high",
        impact_amount: 20000,
        title: "Return spike",
      }),
    ];
    const summary = summarizeIncidents(incidents);
    const blocks = buildDigestBlocks(HUGO_MOCK_STORE_NAME, summary, "https://app.test");

    expect(blocks).toHaveLength(4);

    const text = JSON.stringify(blocks);
    expect(text).toContain(HUGO_MOCK_STORE_NAME);
    expect(text).toContain("Stockout");
    expect(text).toContain("Return spike");
    expect(text).toContain("https://app.test/incidents");
    expect(text).toContain("£50,000");
  });
});
