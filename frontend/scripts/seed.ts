/**
 * Seed Pretty Fly CSVs into Supabase and demo incidents.
 *
 *   bun run scripts/seed.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { resolveDemoCredentials } from "../lib/auth/demo";
import { fetchExternalIdMap, loadContractData } from "../lib/onboarding/contract-loader";
import { TABLE_SPECS } from "../lib/onboarding/schemas";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000100";
const HERO_PRODUCT_EXTERNAL_ID = "prod_00005";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const supabase = createClient(url, key);
const BATCH_SIZE = 500;
const DATA_DIR = path.resolve(scriptDir, "../../hackathon/data-pack/data");

function readContractCsvFiles(): Record<string, string> {
  return Object.fromEntries(
    TABLE_SPECS.map((spec) => {
      const filePath = path.join(DATA_DIR, spec.file);
      return [spec.file, fs.readFileSync(filePath, "utf-8")] as const;
    }),
  );
}

async function upsert(
  table: string,
  rows: Record<string, unknown>[],
  conflictColumn = "id",
) {
  if (rows.length === 0) return;
  for (const chunk of Array.from(
    { length: Math.ceil(rows.length / BATCH_SIZE) },
    (_, i) => rows.slice(i * BATCH_SIZE, i * BATCH_SIZE + BATCH_SIZE),
  )) {
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictColumn });
    if (error) {
      console.error(`  ✗ ${table} (${chunk.length} rows): ${error.message}`);
    }
  }
}

async function ensureDemoOrganization(): Promise<string> {
  console.log("  demo organization…");
  const { error } = await supabase.from("organizations").upsert(
    {
      id: DEMO_ORG_ID,
      name: "Pretty Fly",
      slug: "pretty-fly",
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(`demo organization: ${error.message}`);
  }
  console.log("  ✓ Pretty Fly organization");
  return DEMO_ORG_ID;
}

async function resolveDemoUserId(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(`  ✗ list users: ${error.message}`);
    return null;
  }
  return data.users.find((user) => user.email === email)?.id ?? null;
}

async function ensureDemoUserMembership(organizationId: string) {
  const credentials = resolveDemoCredentials();
  if (!credentials) {
    console.log("  demo user… skipped (set DEMO_USER_* in production)");
    return;
  }

  console.log("  demo user…");
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true,
  });

  const userId =
    created.user?.id ??
    (createError && /already|exists|registered/i.test(createError.message)
      ? await resolveDemoUserId(credentials.email)
      : null);

  if (!userId) {
    console.error(`  ✗ demo user: ${createError?.message ?? "no user id"}`);
    return;
  }

  const { error: memberError } = await supabase.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
    },
    { onConflict: "organization_id,user_id" },
  );
  if (memberError) {
    console.error(`  ✗ demo membership: ${memberError.message}`);
    return;
  }

  console.log(`  ✓ demo user (${credentials.email})`);
}

async function seedRawData(organizationId: string) {
  console.log("\n── Loading raw Pretty Fly data ──────────────────────");

  const results = await loadContractData(supabase, organizationId, readContractCsvFiles(), {
    replace: true,
  });

  for (const result of results) {
    if (result.error) {
      console.error(`  ✗ ${result.table}: ${result.error} (${result.count} rows)`);
    } else {
      console.log(`  ${result.table}… → ${result.count} rows`);
    }
  }

  const failed = results.some((result) => result.error);
  if (failed) {
    throw new Error("Contract CSV load failed");
  }

  console.log("\n  Raw data loaded.\n");
}

async function seedProductKpiThresholds(organizationId: string) {
  console.log("── Seeding product KPI thresholds ───────────────────");

  const [{ data: products, error: listError }, { data: defs, error: defsError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, external_id")
        .eq("organization_id", organizationId),
      supabase
        .from("metric_definitions")
        .select("id, metric_key")
        .eq("organization_id", organizationId),
    ]);

  if (listError) {
    console.error("  ✗ list products:", listError.message);
    return;
  }
  if (defsError) {
    console.error("  ✗ list metric_definitions:", defsError.message);
    return;
  }

  const defByKey = new Map((defs ?? []).map((def) => [def.metric_key, def.id]));
  const defaultMetrics = [
    { metric_key: "return_rate", threshold: 0.12, direction: "above" as const },
    { metric_key: "refund_rate", threshold: 0.08, direction: "above" as const },
    { metric_key: "support_volume", threshold: 10, direction: "above" as const },
  ];

  const defaultRows = (products ?? [])
    .filter((product) => product.external_id !== HERO_PRODUCT_EXTERNAL_ID)
    .flatMap((product) =>
      defaultMetrics.flatMap((metric) => {
        const metricDefinitionId = defByKey.get(metric.metric_key);
        if (!metricDefinitionId) return [];
        return [
          {
            organization_id: organizationId,
            product_id: product.id,
            metric_definition_id: metricDefinitionId,
            threshold: metric.threshold,
            direction: metric.direction,
            active: true,
          },
        ];
      }),
    );

  if (defaultRows.length > 0) {
    await upsert(
      "product_kpi_thresholds",
      defaultRows,
      "organization_id,product_id,metric_definition_id",
    );
    console.log(`  ✓ default thresholds for ${products?.length ?? 0} products`);
  }

  const heroProductId = (products ?? []).find(
    (product) => product.external_id === HERO_PRODUCT_EXTERNAL_ID,
  )?.id;
  const heroMetrics = [
    { metric_key: "return_rate", threshold: 0.2, direction: "above" as const },
    { metric_key: "refund_rate", threshold: 0.15, direction: "above" as const },
    { metric_key: "support_volume", threshold: 25, direction: "above" as const },
  ];

  if (heroProductId) {
    const heroRows = heroMetrics.flatMap((metric) => {
      const metricDefinitionId = defByKey.get(metric.metric_key);
      if (!metricDefinitionId) return [];
      return [
        {
          organization_id: organizationId,
          product_id: heroProductId,
          metric_definition_id: metricDefinitionId,
          threshold: metric.threshold,
          direction: metric.direction,
          active: true,
        },
      ];
    });

    const { error: heroError } = await supabase.from("product_kpi_thresholds").upsert(heroRows, {
      onConflict: "organization_id,product_id,metric_definition_id",
    });
    if (heroError) {
      console.error("  ✗ Court Trainer thresholds:", heroError.message);
    } else {
      console.log(`  ✓ Court Trainer (${HERO_PRODUCT_EXTERNAL_ID}) threshold overrides`);
    }
  }

  console.log("");
}

async function seedDemoIncidents(
  organizationId: string,
  productIdByExternalId: Map<string, string>,
) {
  console.log("── Seeding demo incidents ────────────────────────────");

  const heroProductId = productIdByExternalId.get(HERO_PRODUCT_EXTERNAL_ID) ?? null;
  const now = new Date();
  const minus = (mins: number) =>
    new Date(now.getTime() - mins * 60 * 1000).toISOString();

  const { data: inc1, error: e1 } = await supabase
    .from("incidents")
    .upsert(
      {
        id: "00000000-0000-0000-0000-000000000001",
        organization_id: organizationId,
        title: "Court Trainer Return Spike",
        status: "awaiting_approval",
        severity: "high",
        impact_amount: 66235,
        impact_label: "refund exposure",
        product_id: heroProductId,
        affected_kpi_keys: ["return_rate", "support_volume", "inventory"],
        root_cause:
          "Sizing-related returns driven by first-time buyers from cold Meta traffic. " +
          "22.5% return rate — all sizing. No on-page sizing guidance. " +
          "UK11/UK12 inventory at -153/-150 units as rebuyers are exhausting larger sizes.",
        root_cause_confidence: 91,
        created_at: minus(47),
        investigation_started_at: minus(45),
        fix_proposed_at: minus(38),
      },
      { onConflict: "id" },
    )
    .select()
    .single();
  if (e1 || !inc1) {
    console.error("  ✗ incident 1:", e1?.message ?? "no row");
    return;
  }

  const incidentId = inc1.id as string;

  await supabase.from("agent_findings").upsert(
    [
      {
        id: "00000000-0000-0000-0001-000000000001",
        incident_id: incidentId,
        agent_name: "Returns Agent",
        agent_icon: "📦",
        summary:
          "Sizing-related returns increased 26% QoQ (Q4 2024: 330 → Q4 2025: 417). 501 found product too small vs 402 too large — runs small bias confirmed.",
        detail: {
          return_rate: 0.225,
          total_refund_gbp: 66235,
          yoy_trend: "+26%",
          reason_breakdown: { "Too Small": 501, "Too Large": 402, Other: 12 },
          avg_resolution_time_minutes: 760,
        },
        created_at: minus(42),
      },
      {
        id: "00000000-0000-0000-0001-000000000002",
        incident_id: incidentId,
        agent_name: "Merchandising Agent",
        agent_icon: "🛍️",
        summary:
          "Product page has zero sizing guidance. No size chart, no fit notes. 22.5% sizing return rate is the highest across all 4 trainer SKUs.",
        detail: {
          has_size_guide: false,
          has_fit_assistant: false,
          return_rate_vs_category: { court_trainer: 0.225, category_avg: 0.13 },
          product_external_id: HERO_PRODUCT_EXTERNAL_ID,
          product_id: heroProductId,
        },
        created_at: minus(41),
      },
      {
        id: "00000000-0000-0000-0001-000000000003",
        incident_id: incidentId,
        agent_name: "Marketing Agent",
        agent_icon: "📣",
        summary:
          "Meta cold-traffic campaign drove 1,092 first-time buyers. 45.6% of sizing refunds are first-order customers — no purchase history to inform size recommendation.",
        detail: {
          campaign: "Womens Launch Prospecting",
          first_order_refund_pct: 0.456,
          first_order_refund_count: 1092,
          campaign_roas: 1.1,
          spend_gbp: 18240,
        },
        created_at: minus(40),
      },
      {
        id: "00000000-0000-0000-0001-000000000004",
        incident_id: incidentId,
        agent_name: "Inventory Agent",
        agent_icon: "🏭",
        summary:
          "UK11: -153 units, UK12: -150 units, UK6: -149 units. Rebuyers post-return are purchasing larger sizes, exhausting UK11/12 stock.",
        detail: {
          stockouts: { UK11: -153, UK12: -150, UK6: -149 },
          reorder_within_90_days_pct: 0.415,
          reorder_count: 453,
          chain: "Returns → rebuys in larger size → UK11/UK12 stockout",
        },
        created_at: minus(39),
      },
    ],
    { onConflict: "id" },
  );

  await supabase.from("incident_actions").upsert(
    [
      {
        id: "00000000-0000-0000-0002-000000000001",
        incident_id: incidentId,
        title: "Add sizing guidance to product page",
        description:
          "Publish size chart and fit notes (runs small — size up) to the Court Trainer PDP.",
        impact_level: "high",
        risk_level: "low",
        auto_deploy: true,
        status: "deployed",
        deployed_at: minus(35),
        created_at: minus(38),
      },
      {
        id: "00000000-0000-0000-0002-000000000002",
        incident_id: incidentId,
        title: "Enable fit assistant widget",
        description:
          "Activate the AI fit recommendation widget on the product page — personalised size suggestion based on past orders.",
        impact_level: "high",
        risk_level: "low",
        auto_deploy: false,
        status: "proposed",
        created_at: minus(38),
      },
      {
        id: "00000000-0000-0000-0002-000000000003",
        incident_id: incidentId,
        title: "Update support flow — exchange before refund",
        description:
          "Route sizing-related support tickets to exchange offer first. Estimated to recover £8,200 in refunds.",
        impact_level: "medium",
        risk_level: "low",
        auto_deploy: false,
        status: "proposed",
        created_at: minus(37),
      },
      {
        id: "00000000-0000-0000-0002-000000000004",
        incident_id: incidentId,
        title: "Pause cold-traffic Meta campaign",
        description:
          "Pause 'Womens Launch Prospecting' (ROAS 1.1x) to stop driving unsized first-time buyers until fit assistant is live.",
        impact_level: "high",
        risk_level: "high",
        auto_deploy: false,
        status: "proposed",
        created_at: minus(37),
      },
    ],
    { onConflict: "id" },
  );

  await supabase.from("incident_timeline").upsert(
    [
      {
        id: "00000000-0000-0000-0003-000000000001",
        incident_id: incidentId,
        event_type: "anomaly_detected",
        description: "Return rate for Court Trainer crossed 20% threshold (current: 22.5%)",
        metadata: { threshold: 0.2, actual: 0.225, product: "Court Trainer" },
        created_at: minus(47),
      },
      {
        id: "00000000-0000-0000-0003-000000000002",
        incident_id: incidentId,
        event_type: "incident_created",
        description:
          "Incident opened automatically — severity set to High, impact estimated at £66,235",
        created_at: minus(47),
      },
      {
        id: "00000000-0000-0000-0003-000000000003",
        incident_id: incidentId,
        event_type: "agent_assigned",
        description:
          "4 agents dispatched in parallel: Returns, Merchandising, Marketing, Inventory",
        created_at: minus(45),
      },
      {
        id: "00000000-0000-0000-0003-000000000004",
        incident_id: incidentId,
        event_type: "root_cause_found",
        description:
          "Root cause identified with 91% confidence — sizing-related returns from cold Meta traffic, no on-page guidance",
        metadata: { confidence: 91 },
        created_at: minus(39),
      },
      {
        id: "00000000-0000-0000-0003-000000000005",
        incident_id: incidentId,
        event_type: "action_proposed",
        description: "4 actions proposed: 1 auto-deploy, 3 requiring approval",
        created_at: minus(38),
      },
      {
        id: "00000000-0000-0000-0003-000000000006",
        incident_id: incidentId,
        event_type: "deployed",
        description: "Action auto-deployed: sizing guidance published to Court Trainer product page",
        created_at: minus(35),
      },
    ],
    { onConflict: "id" },
  );

  console.log("  ✓ Incident 1: Court Trainer Return Spike");

  const { error: e2 } = await supabase.from("incidents").upsert(
    {
      id: "00000000-0000-0000-0000-000000000002",
      organization_id: organizationId,
      title: "Wasted Ad Spend — Low-ROAS Campaigns",
      status: "monitoring",
      severity: "medium",
      impact_amount: 112535,
      impact_label: "wasted spend",
      product_id: null,
      affected_kpi_keys: ["ad_roas", "cac", "blended_margin"],
      root_cause:
        "3 campaigns generating 0–1.2x ROAS burning £112,535: Brand Awareness UK (0x), " +
        "Womens Launch Prospecting (1.1x), Generic Streetwear UK (1.2x). Blended ROAS declining YoY.",
      root_cause_confidence: 88,
      created_at: minus(180),
      investigation_started_at: minus(178),
      fix_proposed_at: minus(172),
    },
    { onConflict: "id" },
  );
  if (!e2) console.log("  ✓ Incident 2: Wasted Ad Spend");

  await supabase.from("incidents").upsert(
    {
      id: "00000000-0000-0000-0000-000000000003",
      organization_id: organizationId,
      title: "Court Trainer UK11/UK12 Stockout",
      status: "fix_proposed",
      severity: "critical",
      impact_amount: 24800,
      impact_label: "lost revenue",
      product_id: heroProductId,
      affected_kpi_keys: ["inventory", "lost_sales", "fulfillment_rate"],
      root_cause:
        "UK11 (-153 units) and UK12 (-150 units) are exhausted. Rebuyers post-sizing-return " +
        "are choosing larger sizes, creating a cascade from the returns incident.",
      root_cause_confidence: 95,
      created_at: minus(90),
      investigation_started_at: minus(88),
      fix_proposed_at: minus(82),
    },
    { onConflict: "id" },
  );
  console.log("  ✓ Incident 3: Court Trainer Stockout");

  await supabase.from("incidents").upsert(
    {
      id: "00000000-0000-0000-0000-000000000004",
      organization_id: organizationId,
      title: "M3 Customer Retention at 9.5%",
      status: "investigating",
      severity: "high",
      impact_amount: 48200,
      impact_label: "lifetime value lost",
      product_id: null,
      affected_kpi_keys: ["retention_m3", "ltv", "repeat_order_rate"],
      root_cause: null,
      root_cause_confidence: null,
      created_at: minus(20),
      investigation_started_at: minus(18),
    },
    { onConflict: "id" },
  );
  console.log("  ✓ Incident 4: Low Retention");

  console.log("\n  Demo incidents seeded.\n");
}

async function main() {
  console.log("=== Resolve — seed script ===\n");

  try {
    const organizationId = await ensureDemoOrganization();
    await ensureDemoUserMembership(organizationId);
    await seedRawData(organizationId);
    const productIdByExternalId = await fetchExternalIdMap(
      supabase,
      "products",
      organizationId,
    );
    await seedProductKpiThresholds(organizationId);
    await seedDemoIncidents(organizationId, productIdByExternalId);
    console.log("=== Done ✓ ===\n");
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

main();
