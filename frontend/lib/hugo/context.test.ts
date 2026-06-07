import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "@/lib/stores";
import type { Database } from "@/lib/supabase/database.types";
import {
  buildDeepProductContext,
  buildInventoryContext,
  buildOpenIncidentsContext,
  buildThreadTranscript,
  formatIncidentLine,
  isOpenIncident,
  resolveIncident,
  resolveThreadIncidentReference,
  wantsCatalog,
  wantsDeepProductContext,
  wantsInventory,
  wantsMarketing,
  wantsReturns,
  wantsSupport,
} from "./context";

const { getDetailMock, listMock } = vi.hoisted(() => ({
  getDetailMock: vi.fn(),
  listMock: vi.fn(),
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    incidents: { getDetail: getDetailMock, list: listMock },
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
    store_id: "00000000-0000-0000-0000-000000000101",
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

const supabase = {} as SupabaseClient<Database>;
const scope = { organizationId: "org-1", storeId: "store-1" };

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

  it("detects deep product context prompts", () => {
    expect(wantsReturns("why are returns up on this product?")).toBe(true);
    expect(wantsMarketing("is ROAS down because of ads?")).toBe(true);
    expect(wantsSupport("any support tickets about sizing?")).toBe(true);
    expect(wantsDeepProductContext("why are refunds and support tickets up?")).toBe(true);
    expect(wantsDeepProductContext("hello hugo")).toBe(false);
  });

  it("resolveIncident returns single open match when reference empty", async () => {
    listMock.mockResolvedValue([
      incident({ id: "a", status: "detected" }),
      incident({ id: "b", status: "resolved" }),
    ]);
    const { match } = await resolveIncident(supabase, "", scope);
    expect(match?.id).toBe("a");
  });

  it("resolveIncident matches by title fragment", async () => {
    listMock.mockResolvedValue([
      incident({ title: "Refund spike on SKU-1" }),
      incident({ title: "Other issue" }),
    ]);
    const { match } = await resolveIncident(supabase, "refund spike", scope);
    expect(match?.title).toBe("Refund spike on SKU-1");
  });
});

describe("buildOpenIncidentsContext", () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it("reports when there are no open incidents", async () => {
    listMock.mockResolvedValue([incident({ status: "resolved" })]);
    const ctx = await buildOpenIncidentsContext(supabase, scope);
    expect(ctx).toContain("no open incidents");
  });

  it("lists open incidents", async () => {
    listMock.mockResolvedValue([
      incident({ id: "aaaaaaaa-0000", title: "Return rate spike", status: "detected" }),
      incident({ status: "resolved" }),
    ]);
    const ctx = await buildOpenIncidentsContext(supabase, scope);
    expect(ctx).toContain("Open incidents (1 of 2");
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
}): SupabaseClient<Database> {
  const tableData: Record<string, unknown[]> = {
    products: opts.products,
    business_settings: opts.settings,
  };
  return {
    rpc: vi.fn().mockResolvedValue({ data: opts.outflow, error: null }),
    from: (table: string) => ({
      select: () => ({
        eq: () => {
          const result = Promise.resolve({ data: tableData[table] ?? [], error: null });
          return Object.assign(result, {
            eq: () => Promise.resolve({ data: tableData[table] ?? [], error: null }),
          });
        },
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("buildInventoryContext", () => {
  it("reports when no inventory data exists", async () => {
    const ctx = await buildInventoryContext(
      inventorySupabase({ outflow: [], products: [], settings: [] }),
      scope,
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
      scope,
    );

    expect(ctx).toContain("3 products; 1 out of stock, 1 need reorder");
    expect(ctx).toContain(
      "Hoodie (aaaaaaaa): 10 units in stock, ~5.0 units/day, ~2d to stockout — reorder urgent",
    );
    expect(ctx).toContain("Cap (bbbbbbbb): 0 units in stock");
    expect(ctx).toContain("OUT OF STOCK");
    expect(ctx).toContain("Socks (cccccccc): 1000 units in stock");
    expect(ctx.indexOf("Cap")).toBeLessThan(ctx.indexOf("Hoodie"));
    expect(ctx.indexOf("Hoodie")).toBeLessThan(ctx.indexOf("Socks"));
  });
});

describe("buildDeepProductContext", () => {
  beforeEach(() => {
    getDetailMock.mockReset();
  });

  it("returns nothing when no incident product is referenced", async () => {
    getDetailMock.mockResolvedValue({ incident: incident({ product_id: null }) });

    await expect(
      buildDeepProductContext(supabase, scope, "inc-1"),
    ).resolves.toBeNull();
  });

  it("formats returns, marketing, and support context for an incident product", async () => {
    getDetailMock.mockResolvedValue({
      incident: incident({ id: "inc-1", product_id: "prod-1" }),
    });
    const ctxSupabase = {
      rpc: vi.fn(() => ({
        range: vi.fn(() =>
          Promise.resolve({
            data: [
              {
                product_id: "prod-1",
                month: "2024-01-01",
                units: 10,
                revenue: 1000,
                refund_amount: 100,
                refund_count: 2,
                ad_spend: 200,
                ad_revenue: 600,
              },
              {
                product_id: "prod-1",
                month: "2024-02-01",
                units: 8,
                revenue: 800,
                refund_amount: 160,
                refund_count: 4,
                ad_spend: 300,
                ad_revenue: 450,
              },
            ],
            error: null,
          }),
        ),
      })),
      from: vi.fn((table: string) => {
        const builder = {
          select: vi.fn(() => builder),
          eq: vi.fn(() => builder),
          single: vi.fn(() =>
            Promise.resolve({ data: { default_threshold: 1.5 }, error: null }),
          ),
          limit: vi.fn(() => {
            if (table === "support_tickets") {
              return Promise.resolve({
                data: [
                  {
                    subject: "Sizing issue",
                    status: "open",
                    priority: "high",
                    category: "returns",
                  },
                ],
                error: null,
              });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        };
        return builder;
      }),
    } as unknown as SupabaseClient<Database>;

    const context = await buildDeepProductContext(ctxSupabase, scope, "inc-1");

    expect(context).toContain("Deep product context");
    expect(context).toContain("refund rate 20.0%");
    expect(context).toContain("ROAS 1.50");
    expect(context).toContain("support tickets");
    expect(context).toContain("Sizing issue");
  });
});
