import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/incidents";
import {
  buildOpenIncidentsContext,
  formatIncidentLine,
  isOpenIncident,
  resolveIncident,
  wantsCatalog,
} from "./context";

const { listIncidentsMock } = vi.hoisted(() => ({ listIncidentsMock: vi.fn() }));

vi.mock("@/lib/incidents", () => ({ listIncidents: listIncidentsMock }));
vi.mock("@/lib/catalog", () => ({
  computeProductHealth: vi.fn(),
  listCatalogWithThresholds: vi.fn(),
}));

function incident(overrides: Partial<Incident>): Incident {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    title: "Return rate spike",
    status: "detected",
    severity: "high",
    impact_amount: 1234,
    impact_label: null,
    affected_product: "SKU-1",
    affected_kpis: ["return_rate"],
    root_cause: null,
    root_cause_confidence: null,
    created_at: "2024-01-01T00:00:00Z",
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

const supabase = {} as SupabaseClient;

beforeEach(() => {
  listIncidentsMock.mockReset();
});

describe("isOpenIncident", () => {
  it("treats resolved/closed as not open", () => {
    expect(isOpenIncident(incident({ status: "detected" }))).toBe(true);
    expect(isOpenIncident(incident({ status: "resolved" }))).toBe(false);
    expect(isOpenIncident(incident({ status: "CLOSED" }))).toBe(false);
  });
});

describe("formatIncidentLine", () => {
  it("includes id prefix, title, severity, status, product, impact", () => {
    const line = formatIncidentLine(incident({}));
    expect(line).toContain("[11111111]");
    expect(line).toContain("Return rate spike");
    expect(line).toContain("severity: high");
    expect(line).toContain("status: detected");
    expect(line).toContain("product: SKU-1");
    expect(line).toContain("£1,234");
  });
});

describe("wantsCatalog", () => {
  it("detects KPI/product keywords", () => {
    expect(wantsCatalog("what's the return rate for hoodies?")).toBe(true);
    expect(wantsCatalog("any KPI breaches?")).toBe(true);
    expect(wantsCatalog("hey hugo how are you")).toBe(false);
  });
});

describe("resolveIncident", () => {
  it("matches a single incident by title fragment", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", title: "Return rate spike" }),
      incident({ id: "bbbbbbbb-0000", title: "ROAS collapse" }),
    ]);
    const { match } = await resolveIncident(supabase, "roas");
    expect(match?.title).toBe("ROAS collapse");
  });

  it("returns candidates when the reference is ambiguous", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", title: "Return rate spike", affected_product: "SKU-1" }),
      incident({ id: "bbbbbbbb-0000", title: "Refund surge", affected_product: "SKU-1" }),
    ]);
    const { match, candidates } = await resolveIncident(supabase, "SKU-1");
    expect(match).toBeNull();
    expect(candidates).toHaveLength(2);
  });

  it("auto-selects the only open incident when reference is empty", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", status: "detected" }),
      incident({ id: "bbbbbbbb-0000", status: "resolved" }),
    ]);
    const { match } = await resolveIncident(supabase, "");
    expect(match?.id).toBe("aaaaaaaa-0000");
  });
});

describe("buildOpenIncidentsContext", () => {
  it("reports when there are no open incidents", async () => {
    listIncidentsMock.mockResolvedValue([incident({ status: "resolved" })]);
    const ctx = await buildOpenIncidentsContext(supabase);
    expect(ctx).toContain("no open incidents");
  });

  it("lists open incidents", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", title: "Return rate spike", status: "detected" }),
    ]);
    const ctx = await buildOpenIncidentsContext(supabase);
    expect(ctx).toContain("Open incidents (1 of 1");
    expect(ctx).toContain("Return rate spike");
  });
});
