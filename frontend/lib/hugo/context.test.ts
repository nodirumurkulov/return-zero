import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/incidents";
import {
  buildThreadTranscript,
  buildInventoryContext,
  buildOpenIncidentsContext,
  formatIncidentLine,
  isOpenIncident,
  resolveIncident,
  resolveThreadIncidentReference,
  wantsCatalog,
  wantsInventory,
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
    organization_id: "00000000-0000-0000-0000-000000000100",
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

const supabase = {} as SupabaseClient;
const orgId = "00000000-0000-0000-0000-000000000100";

beforeEach(() => {
  listIncidentsMock.mockReset();
});

describe("isOpenIncident", () => {
  it("treats resolved/canceled as not open", () => {
    expect(isOpenIncident(incident({ status: "detected" }))).toBe(true);
    expect(isOpenIncident(incident({ status: "resolved" }))).toBe(false);
    expect(isOpenIncident(incident({ status: "canceled" }))).toBe(false);
  });
});

describe("formatIncidentLine", () => {
  it("includes id prefix, title, severity, status, product, impact", () => {
    const line = formatIncidentLine(incident({}));
    expect(line).toContain("[11111111]");
    expect(line).toContain("Return rate spike");
    expect(line).toContain("severity: high");
    expect(line).toContain("status: detected");
    expect(line).toContain("product: aaaaaaaa");
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
    const { match } = await resolveIncident(supabase, "roas", orgId);
    expect(match?.title).toBe("ROAS collapse");
  });

  it("returns candidates when the reference is ambiguous", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", title: "Return rate spike", product_id: "prod-a" }),
      incident({ id: "bbbbbbbb-0000", title: "Refund surge", product_id: "prod-a" }),
    ]);
    const { match, candidates } = await resolveIncident(supabase, "prod-a", orgId);
    expect(match).toBeNull();
    expect(candidates).toHaveLength(2);
  });

  it("auto-selects the only open incident when reference is empty", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", status: "detected" }),
      incident({ id: "bbbbbbbb-0000", status: "resolved" }),
    ]);
    const { match } = await resolveIncident(supabase, "", orgId);
    expect(match?.id).toBe("aaaaaaaa-0000");
  });
});

describe("buildOpenIncidentsContext", () => {
  it("reports when there are no open incidents", async () => {
    listIncidentsMock.mockResolvedValue([incident({ status: "resolved" })]);
    const ctx = await buildOpenIncidentsContext(supabase, orgId);
    expect(ctx).toContain("no open incidents");
  });

  it("lists open incidents", async () => {
    listIncidentsMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", title: "Return rate spike", status: "detected" }),
    ]);
    const ctx = await buildOpenIncidentsContext(supabase, orgId);
    expect(ctx).toContain("Open incidents (1 of 1");
    expect(ctx).toContain("Return rate spike");
  });
});

describe("wantsInventory", () => {
  it("detects stock/inventory keywords", () => {
    expect(wantsInventory("how many units of the hoodie are in stock?")).toBe(true);
    expect(wantsInventory("which products are running low on inventory?")).toBe(true);
    expect(wantsInventory("anything out of stock?")).toBe(true);
    expect(wantsInventory("how many days until that stocks out?")).toBe(true);
    expect(wantsInventory("what's the worst incident today?")).toBe(false);
  });
});

describe("buildThreadTranscript", () => {
  it("normalizes Slack thread messages into a compact Hugo transcript", () => {
    const transcript = buildThreadTranscript([
      { user: "U1", text: "<@UHUGO> show open incidents", ts: "1" },
      { bot_id: "B1", text: "1. Return spike [aaaaaaaa]\n2. Stockout risk [bbbbbbbb]", ts: "2" },
      { user: "U1", text: "investigate the second one", ts: "3" },
      { user: "U1", text: "   ", ts: "4" },
    ]);

    expect(transcript).toBe(
      [
        "User: show open incidents",
        "Hugo: 1. Return spike [aaaaaaaa]\n2. Stockout risk [bbbbbbbb]",
        "User: investigate the second one",
      ].join("\n"),
    );
  });
});

describe("resolveThreadIncidentReference", () => {
  it("resolves ordinal references from Hugo's prior numbered incident list", () => {
    const transcript = [
      "User: show open incidents",
      "Hugo: 1. Return spike [aaaaaaaa]\n2. Stockout risk [bbbbbbbb]\n3. ROAS drop [cccccccc]",
      "User: investigate the second one",
    ].join("\n");

    expect(resolveThreadIncidentReference("investigate the second one", transcript)).toBe("bbbbbbbb");
  });

  it("resolves pronouns to the most recently mentioned incident", () => {
    const transcript = [
      "User: show stockout risk",
      "Hugo: Stockout risk [bbbbbbbb] has ~3d to stockout.",
      "User: how many days until that stocks out?",
    ].join("\n");

    expect(resolveThreadIncidentReference("how many days until that stocks out?", transcript)).toBe(
      "bbbbbbbb",
    );
  });
});

type OutflowRow = { product_id: string; daily_outflow: number; current_balance: number };
type ProductRow = { id: string; title: string | null };
type SettingRow = { key: string; value: number };

function inventorySupabase(opts: {
  outflow: OutflowRow[];
  products: ProductRow[];
  settings: SettingRow[];
}): SupabaseClient {
  const tableData: Record<string, unknown[]> = {
    products: opts.products,
    business_settings: opts.settings,
  };
  return {
    rpc: vi.fn().mockResolvedValue({ data: opts.outflow, error: null }),
    from: (table: string) => ({
      select: () => ({
        eq: () => Promise.resolve({ data: tableData[table] ?? [], error: null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("buildInventoryContext", () => {
  it("reports when no inventory data exists", async () => {
    const ctx = await buildInventoryContext(
      inventorySupabase({ outflow: [], products: [], settings: [] }),
      orgId,
    );
    expect(ctx).toContain("No inventory data");
  });

  it("lists stock, flags out-of-stock + reorder-urgent, sorts most-urgent first", async () => {
    const ctx = await buildInventoryContext(
      inventorySupabase({
        outflow: [
          { product_id: "cccccccc-0000", daily_outflow: 1, current_balance: 1000 },
          { product_id: "aaaaaaaa-0000", daily_outflow: 5, current_balance: 10 },
          { product_id: "bbbbbbbb-0000", daily_outflow: 2, current_balance: 0 },
        ],
        products: [
          { id: "aaaaaaaa-0000", title: "Hoodie" },
          { id: "bbbbbbbb-0000", title: "Cap" },
          { id: "cccccccc-0000", title: "Socks" },
        ],
        settings: [
          { key: "lead_time_days", value: 71 },
          { key: "buffer_days", value: 14 },
        ],
      }),
      orgId,
    );

    expect(ctx).toContain("3 products; 1 out of stock, 1 need reorder");
    expect(ctx).toContain("Hoodie (aaaaaaaa): 10 units in stock, ~5.0 units/day, ~2d to stockout — reorder urgent");
    expect(ctx).toContain("Cap (bbbbbbbb): 0 units in stock");
    expect(ctx).toContain("OUT OF STOCK");
    expect(ctx).toContain("Socks (cccccccc): 1000 units in stock");

    // Out-of-stock (days_to_stockout = 0) sorts ahead of the urgent hoodie, which
    // sorts ahead of well-stocked socks.
    expect(ctx.indexOf("Cap")).toBeLessThan(ctx.indexOf("Hoodie"));
    expect(ctx.indexOf("Hoodie")).toBeLessThan(ctx.indexOf("Socks"));
  });
});
