import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveActiveStoreId } from "@/lib/stores/connection/reset-store-data";
import type { Database, TablesInsert } from "@/lib/supabase/database.types";

import { COURT_TRAINER_PRODUCT_EXTERNAL_ID } from "../constants";

const HERO_PRODUCT_EXTERNAL_ID = COURT_TRAINER_PRODUCT_EXTERNAL_ID;
const BATCH_SIZE = 500;

async function upsert(
  supabase: SupabaseClient<Database>,
  table: "product_kpi_thresholds",
  rows: TablesInsert<"product_kpi_thresholds">[],
  conflictColumn = "id",
) {
  if (rows.length === 0) return;
  for (const chunk of Array.from(
    { length: Math.ceil(rows.length / BATCH_SIZE) },
    (_, i) => rows.slice(i * BATCH_SIZE, i * BATCH_SIZE + BATCH_SIZE),
  )) {
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflictColumn });
    if (error) {
      console.error(`  ✗ ${table} (${chunk.length} rows): ${error.message}`);
    }
  }
}

export async function seedProductKpiThresholds(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const [{ data: products, error: listError }, { data: defs, error: defsError }] = await Promise.all([
    supabase.from("products").select("id, external_id").eq("organization_id", organizationId),
    supabase.from("metric_definitions").select("id, metric_key").eq("organization_id", organizationId),
  ]);

  if (listError) throw new Error(`list products: ${listError.message}`);
  if (defsError) throw new Error(`list metric_definitions: ${defsError.message}`);

  const defByKey = new Map(
    (defs ?? []).map((def) => [def.metric_key, def.id] as [string, string]),
  );
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
    await upsert(supabase, "product_kpi_thresholds", defaultRows, "organization_id,product_id,metric_definition_id");
  }

  const heroProductId = (products ?? []).find((product) => product.external_id === HERO_PRODUCT_EXTERNAL_ID)?.id;
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
    if (heroError) throw new Error(`Court Trainer thresholds: ${heroError.message}`);
  }
}

export async function seedDemoIncidents(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productIdByExternalId: Map<string, string>,
) {
  const storeId = await resolveActiveStoreId(supabase, organizationId);
  const heroProductId = productIdByExternalId.get(HERO_PRODUCT_EXTERNAL_ID) ?? null;
  const now = new Date();
  const minus = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

  const { data: inc1, error: e1 } = await supabase
    .from("incidents")
    .upsert(
      {
        id: "00000000-0000-0000-0000-000000000001",
        organization_id: organizationId,
        store_id: storeId,
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
  if (e1 || !inc1) throw new Error(`incident 1: ${e1?.message ?? "no row"}`);

  const incidentId = inc1.id;

  await supabase.from("agent_findings").upsert(
    [
      {
        id: "00000000-0000-0000-0001-000000000001",
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
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
        organization_id: organizationId,
        incident_id: incidentId,
        event_type: "anomaly_detected",
        description: "Return rate for Court Trainer crossed 20% threshold (current: 22.5%)",
        metadata: { threshold: 0.2, actual: 0.225, product: "Court Trainer" },
        created_at: minus(47),
      },
      {
        id: "00000000-0000-0000-0003-000000000002",
        organization_id: organizationId,
        incident_id: incidentId,
        event_type: "incident_created",
        description:
          "Incident opened automatically — severity set to High, impact estimated at £66,235",
        created_at: minus(47),
      },
      {
        id: "00000000-0000-0000-0003-000000000003",
        organization_id: organizationId,
        incident_id: incidentId,
        event_type: "agent_assigned",
        description:
          "4 agents dispatched in parallel: Returns, Merchandising, Marketing, Inventory",
        created_at: minus(45),
      },
      {
        id: "00000000-0000-0000-0003-000000000004",
        organization_id: organizationId,
        incident_id: incidentId,
        event_type: "root_cause_found",
        description:
          "Root cause identified with 91% confidence — sizing-related returns from cold Meta traffic, no on-page guidance",
        metadata: { confidence: 91 },
        created_at: minus(39),
      },
      {
        id: "00000000-0000-0000-0003-000000000005",
        organization_id: organizationId,
        incident_id: incidentId,
        event_type: "action_proposed",
        description: "4 actions proposed: 1 auto-deploy, 3 requiring approval",
        created_at: minus(38),
      },
      {
        id: "00000000-0000-0000-0003-000000000006",
        organization_id: organizationId,
        incident_id: incidentId,
        event_type: "deployed",
        description: "Action auto-deployed: sizing guidance published to Court Trainer product page",
        created_at: minus(35),
      },
    ],
    { onConflict: "id" },
  );

  await supabase.from("incidents").upsert(
    {
      id: "00000000-0000-0000-0000-000000000002",
      organization_id: organizationId,
      store_id: storeId,
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

  await supabase.from("incidents").upsert(
    {
      id: "00000000-0000-0000-0000-000000000003",
      organization_id: organizationId,
      store_id: storeId,
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

  await supabase.from("incidents").upsert(
    {
      id: "00000000-0000-0000-0000-000000000004",
      organization_id: organizationId,
      store_id: storeId,
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
}

export async function seedDemoKanbanData(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productIdByExternalId: Map<string, string>,
) {
  await seedProductKpiThresholds(supabase, organizationId);
  await seedDemoIncidents(supabase, organizationId, productIdByExternalId);
}
