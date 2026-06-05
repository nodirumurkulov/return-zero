import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/stores";
import {
  buildInventoryContext,
  buildOpenIncidentsContext,
  formatIncidentLine,
  isOpenIncident,
  resolveIncident,
  wantsCatalog,
  wantsInventory,
} from "./context";

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    incidents: { list: listMock },
    catalog: {
      list: vi.fn(),
      health: vi.fn(),
    },
  })),
}));

function incident(overrides: Partial<Incident>): Incident {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    organization_id: "00000000-0000-0000-0000-000000000100",
    title: "Return rate spike",
    status: "detected",
    severity: "high",
    impact_amount: 1000,
    impact_label: "GBP",
    product_id: null,
    affected_kpi_keys: [],
    root_cause: null,
    root_cause_confidence: null,
    monitoring_kpi: null,
    baseline_value: null,
    target_value: null,
    recovery_pct: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null,
    investigation_started_at: null,
    fix_proposed_at: null,
    monitoring_started_at: null,
    ...overrides,
  };
}

const supabase = {} as SupabaseClient;

describe("hugo context helpers", () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it("formatIncidentLine includes severity and status", () => {
    const line = formatIncidentLine(incident({}));
    expect(line).toContain("Return rate spike");
    expect(line).toContain("severity: high");
  });

  it("isOpenIncident excludes resolved and canceled", () => {
    expect(isOpenIncident(incident({ status: "detected" }))).toBe(true);
    expect(isOpenIncident(incident({ status: "resolved" }))).toBe(false);
    expect(isOpenIncident(incident({ status: "canceled" }))).toBe(false);
  });

  it("wantsCatalog detects KPI-related prompts", () => {
    expect(wantsCatalog("show me catalog health")).toBe(true);
    expect(wantsCatalog("hello hugo")).toBe(false);
  });

  it("wantsInventory detects stock-related prompts", () => {
    expect(wantsInventory("how much stock left?")).toBe(true);
    expect(wantsInventory("approve the incident")).toBe(false);
  });

  it("resolveIncident returns single open match when reference empty", async () => {
    listMock.mockResolvedValue([
      incident({ id: "a", status: "detected" }),
      incident({ id: "b", status: "resolved" }),
    ]);
    const { match } = await resolveIncident(supabase, "", "org-1");
    expect(match?.id).toBe("a");
  });

  it("resolveIncident matches by title fragment", async () => {
    listMock.mockResolvedValue([
      incident({ title: "Refund spike on SKU-1" }),
      incident({ title: "Other issue" }),
    ]);
    const { match } = await resolveIncident(supabase, "refund spike", "org-1");
    expect(match?.title).toBe("Refund spike on SKU-1");
  });

  it("buildOpenIncidentsContext summarizes open incidents", async () => {
    listMock.mockResolvedValue([
      incident({ status: "detected" }),
      incident({ status: "resolved" }),
    ]);
    const text = await buildOpenIncidentsContext(supabase, "org-1");
    expect(text).toContain("Open incidents (1 of 2 total");
  });

  it("buildInventoryContext handles empty outflow data", async () => {
    const emptySupabase = {
      rpc: vi.fn(() => Promise.resolve({ data: [] })),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    } as unknown as SupabaseClient;
    const text = await buildInventoryContext(emptySupabase, "org-1");
    expect(text).toContain("No inventory data");
  });
});
