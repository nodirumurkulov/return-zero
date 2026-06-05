/**
 * Seed Pretty Fly CSVs into Supabase and demo incidents.
 *
 *   bun run scripts/seed.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { stageFutureStream } from "../lib/detection/stream-stage";
import { resolveDemoCredentials } from "../lib/auth/demo";

type CsvRow = Record<string, string | number | boolean | null | undefined>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const supabase = createClient(url, key);
const BATCH_SIZE = 500;
const DATA_DIR = path.resolve(scriptDir, "../../hackathon/data-pack/data");

function readCSV(filename: string): CsvRow[] {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  }) as CsvRow[];
}

function scopedConflict(conflictColumn: string, ownerUserId: string): string {
  return conflictColumn.includes("owner_user_id")
    ? conflictColumn
    : `owner_user_id,${conflictColumn}`;
}

async function upsert(
  table: string,
  rows: Record<string, unknown>[],
  conflictColumn = "id",
  ownerUserId?: string,
) {
  if (rows.length === 0) return;
  const stamped = ownerUserId
    ? rows.map((row) => ({ ...row, owner_user_id: ownerUserId }))
    : rows;
  const onConflict = ownerUserId ? scopedConflict(conflictColumn, ownerUserId) : conflictColumn;
  for (const chunk of Array.from(
    { length: Math.ceil(stamped.length / BATCH_SIZE) },
    (_, i) => stamped.slice(i * BATCH_SIZE, i * BATCH_SIZE + BATCH_SIZE),
  )) {
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict });
    if (error) {
      throw new Error(`${table} upsert failed (${chunk.length} rows): ${error.message}`);
    }
  }
}

function coerceBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return Boolean(val);
}

// ---- Load raw data -------------------------------------------
async function seedRawData(ownerUserId: string) {
  console.log("\n── Loading raw Pretty Fly data ──────────────────────");

  // products
  console.log("  products…");
  const products = readCSV("products.csv");
  await upsert("products", products.map((r) => ({
    product_id: r.product_id,
    title: r.title,
    handle: r.handle,
    description: r.description,
    product_type: r.product_type,
    vendor: r.vendor,
    collection: r.collection,
    gender_segment: r.gender_segment,
    tags: r.tags,
    status: r.status,
    created_at: r.created_at,
  })), "product_id", ownerUserId);
  console.log(`    → ${products.length} rows`);

  // variants
  console.log("  variants…");
  const variants = readCSV("variants.csv");
  await upsert("variants", variants.map((r) => ({
    variant_id: r.variant_id,
    product_id: r.product_id,
    sku: r.sku,
    option1_name: r.option1_name,
    option1_value: r.option1_value,
    option2_name: r.option2_name,
    option2_value: r.option2_value,
    price: r.price,
    compare_at_price: r.compare_at_price || null,
    barcode: r.barcode,
    weight_grams: r.weight_grams,
    inventory_quantity: r.inventory_quantity,
  })), "variant_id", ownerUserId);
  console.log(`    → ${variants.length} rows`);

  // customers
  console.log("  customers…");
  const customers = readCSV("customers.csv");
  await upsert("customers", customers.map((r) => ({
    customer_id: r.customer_id,
    email: r.email,
    first_name: r.first_name,
    last_name: r.last_name,
    created_at: r.created_at,
    accepts_marketing: coerceBool(r.accepts_marketing),
    total_spent: r.total_spent,
    orders_count: r.orders_count,
    acquisition_source: r.acquisition_source,
    acquisition_date: r.acquisition_date || null,
    default_country: r.default_country,
    gender_segment_affinity: r.gender_segment_affinity,
  })), "customer_id", ownerUserId);
  console.log(`    → ${customers.length} rows`);

  // orders
  console.log("  orders…");
  const orders = readCSV("orders.csv");
  await upsert("orders", orders.map((r) => ({
    order_id: r.order_id,
    order_number: r.order_number,
    customer_id: r.customer_id,
    created_at: r.created_at,
    currency: r.currency,
    subtotal: r.subtotal,
    total_discounts: r.total_discounts,
    total_shipping: r.total_shipping,
    total_tax: r.total_tax,
    total_price: r.total_price,
    financial_status: r.financial_status,
    fulfillment_status: r.fulfillment_status,
    utm_source: r.utm_source,
    utm_medium: r.utm_medium,
    utm_campaign: r.utm_campaign,
    landing_site: r.landing_site,
    referring_site: r.referring_site,
    tags: r.tags,
    discount_code: r.discount_code,
  })), "order_id", ownerUserId);
  console.log(`    → ${orders.length} rows`);

  // line_items
  console.log("  line_items…");
  const lineItems = readCSV("line_items.csv");
  await upsert("line_items", lineItems.map((r) => ({
    line_item_id: r.line_item_id,
    order_id: r.order_id,
    variant_id: r.variant_id,
    product_id: r.product_id,
    title: r.title,
    quantity: r.quantity,
    price: r.price,
    total_discount: r.total_discount,
  })), "line_item_id", ownerUserId);
  console.log(`    → ${lineItems.length} rows`);

  // refunds
  console.log("  refunds…");
  const refunds = readCSV("refunds.csv");
  await upsert("refunds", refunds.map((r) => ({
    refund_id: r.refund_id,
    order_id: r.order_id,
    created_at: r.created_at,
    amount: r.amount,
    reason: r.reason,
    refund_line_items: r.refund_line_items,
  })), "refund_id", ownerUserId);
  console.log(`    → ${refunds.length} rows`);

  // collections
  console.log("  collections…");
  const collections = readCSV("collections.csv");
  await upsert("collections", collections.map((r) => ({
    collection_id: r.collection_id,
    title: r.title,
    created_at: r.created_at,
  })), "collection_id", ownerUserId);
  console.log(`    → ${collections.length} rows`);

  // meta_ads_daily
  console.log("  meta_ads_daily…");
  const metaAds = readCSV("meta_ads_daily.csv");
  await upsert(
    "meta_ads_daily",
    metaAds.map((r) => ({
      date: r.date,
      campaign_name: r.campaign_name,
      campaign_objective: r.campaign_objective,
      ad_set: r.ad_set,
      ad_name: r.ad_name,
      placement: r.placement,
      impressions: r.impressions,
      clicks: r.clicks,
      spend_gbp: r.spend_gbp,
      conversions: r.conversions,
      conversion_value_gbp: r.conversion_value_gbp,
    })),
    "date,campaign_name,ad_name,placement",
    ownerUserId,
  );
  console.log(`    → ${metaAds.length} rows`);

  // google_ads_daily
  console.log("  google_ads_daily…");
  const googleAds = readCSV("google_ads_daily.csv");
  await upsert(
    "google_ads_daily",
    googleAds.map((r) => ({
      date: r.date,
      campaign_name: r.campaign_name,
      campaign_type: r.campaign_type,
      ad_group: r.ad_group,
      impressions: r.impressions,
      clicks: r.clicks,
      spend_gbp: r.spend_gbp,
      conversions: r.conversions,
      conversion_value_gbp: r.conversion_value_gbp,
    })),
    "date,campaign_name,ad_group",
    ownerUserId,
  );
  console.log(`    → ${googleAds.length} rows`);

  // inventory_movements
  console.log("  inventory_movements…");
  const movements = readCSV("inventory_movements.csv");
  await upsert("inventory_movements", movements.map((r) => ({
    movement_id: r.movement_id,
    variant_id: r.variant_id,
    date: r.date,
    type: r.type,
    quantity_delta: r.quantity_delta,
    running_balance: r.running_balance,
    reference_id: r.reference_id,
  })), "movement_id", ownerUserId);
  console.log(`    → ${movements.length} rows`);

  // support_tickets
  console.log("  support_tickets…");
  const tickets = readCSV("support_tickets.csv");
  await upsert("support_tickets", tickets.map((r) => ({
    ticket_id: r.ticket_id,
    customer_id: r.customer_id,
    created_at: r.created_at,
    channel: r.channel,
    status: r.status,
    priority: r.priority,
    category: r.category,
    subject: r.subject,
    related_order_id: r.related_order_id || null,
    related_product_id: r.related_product_id || null,
    first_response_at: r.first_response_at || null,
    resolved_at: r.resolved_at || null,
    resolution_time_minutes: r.resolution_time_minutes || null,
    satisfaction_rating: r.satisfaction_rating || null,
    resolved_by: r.resolved_by,
  })), "ticket_id", ownerUserId);
  console.log(`    → ${tickets.length} rows`);

  // purchase_orders + po_line_items
  console.log("  purchase_orders…");
  const pos = readCSV("purchase_orders.csv");
  await upsert("purchase_orders", pos.map((r) => ({
    po_id: r.po_id,
    supplier_id: r.supplier_id,
    created_at: r.created_at,
    expected_delivery: r.expected_delivery || null,
    actual_delivery: r.actual_delivery || null,
    status: r.status,
    total_cost_supplier_ccy: r.total_cost_supplier_ccy,
    total_cost_gbp: r.total_cost_gbp,
    deposit_paid_at: r.deposit_paid_at || null,
    balance_paid_at: r.balance_paid_at || null,
  })), "po_id", ownerUserId);
  console.log(`    → ${pos.length} rows`);

  console.log("  po_line_items…");
  const poLines = readCSV("po_line_items.csv");
  await upsert("po_line_items", poLines.map((r) => ({
    po_line_id: r.po_line_id,
    po_id: r.po_id,
    variant_id: r.variant_id,
    quantity_ordered: r.quantity_ordered,
    quantity_received: r.quantity_received,
    unit_cost_supplier_ccy: r.unit_cost_supplier_ccy,
    landed_cost_per_unit_gbp: r.landed_cost_per_unit_gbp,
  })), "po_line_id", ownerUserId);
  console.log(`    → ${poLines.length} rows`);

  console.log("  stage_future_stream…");
  await stageFutureStream(supabase);
  console.log("    → history in live tables, future in *_stream");

  console.log("\n  Raw data loaded.\n");
}

// ---- Per-product KPI thresholds (after products exist) --------
async function seedProductKpiThresholds(ownerUserId: string) {
  console.log("── Seeding product KPI thresholds ───────────────────");

  const { data: products, error: listError } = await supabase
    .from("products")
    .select("product_id")
    .eq("owner_user_id", ownerUserId);
  if (listError) {
    console.error("  ✗ list products:", listError.message);
    return;
  }

  const defaultMetrics = [
    { metric_key: "return_rate", threshold: 0.12, direction: "above" },
    { metric_key: "refund_rate", threshold: 0.08, direction: "above" },
    { metric_key: "support_volume", threshold: 10, direction: "above" },
  ] as const;

  const defaultRows = (products ?? [])
    .filter((p) => p.product_id !== "prod_00005")
    .flatMap((p) =>
      defaultMetrics.map((m) => ({
        product_id: p.product_id,
        metric_key: m.metric_key,
        threshold: m.threshold,
        direction: m.direction,
        active: true,
      })),
    );

  if (defaultRows.length > 0) {
    await upsert("product_kpi_thresholds", defaultRows, "product_id,metric_key", ownerUserId);
    console.log(`  ✓ default thresholds for ${products?.length ?? 0} products`);
  }

  const { error: heroError } = await supabase.from("product_kpi_thresholds").upsert(
    [
      {
        owner_user_id: ownerUserId,
        product_id: "prod_00005",
        metric_key: "return_rate",
        threshold: 0.2,
        direction: "above",
        active: true,
      },
      {
        owner_user_id: ownerUserId,
        product_id: "prod_00005",
        metric_key: "refund_rate",
        threshold: 0.15,
        direction: "above",
        active: true,
      },
      {
        owner_user_id: ownerUserId,
        product_id: "prod_00005",
        metric_key: "support_volume",
        threshold: 25,
        direction: "above",
        active: true,
      },
    ],
    { onConflict: "owner_user_id,product_id,metric_key" },
  );
  if (heroError) {
    console.error("  ✗ Court Trainer thresholds:", heroError.message);
  } else {
    console.log("  ✓ Court Trainer (prod_00005) threshold overrides");
  }

  console.log("");
}

// ---- Seed demo incidents -------------------------------------
async function seedDemoIncidents(ownerUserId: string) {
  console.log("── Seeding demo incidents ────────────────────────────");

  const now = new Date();
  const minus = (mins: number) =>
    new Date(now.getTime() - mins * 60 * 1000).toISOString();

  // ── Incident 1: Court Trainer Return Spike (main demo) ──────
  const { data: inc1, error: e1 } = await supabase
    .from("incidents")
    .upsert(
      {
        id: "00000000-0000-0000-0000-000000000001",
        owner_user_id: ownerUserId,
        title: "Court Trainer Return Spike",
        status: "awaiting_approval",
        severity: "high",
        impact_amount: 66235,
        impact_label: "refund exposure",
        affected_product: "prod_00005",
        affected_kpis: ["return_rate", "support_volume", "inventory"],
        root_cause:
          "Sizing-related returns driven by first-time buyers from cold Meta traffic. " +
          "22.5% return rate — all sizing. No on-page sizing guidance. " +
          "UK11/UK12 inventory at -153/-150 units as rebuyers are exhausting larger sizes.",
        root_cause_confidence: 91,
        created_at: minus(47),
        investigation_started_at: minus(45),
        fix_proposed_at: minus(38),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (e1 || !inc1) {
    console.error("  ✗ incident 1:", e1?.message ?? "no row");
    return;
  }

  const incidentId = inc1.id as string;

  // agent findings
  await supabase.from("agent_findings").upsert([
    {
      id: "00000000-0000-0000-0001-000000000001",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      agent_name: "Returns Agent",
      agent_icon: "📦",
      summary: "Sizing-related returns increased 26% QoQ (Q4 2024: 330 → Q4 2025: 417). 501 found product too small vs 402 too large — runs small bias confirmed.",
      detail: {
        return_rate: 0.225,
        total_refund_gbp: 66235,
        yoy_trend: "+26%",
        reason_breakdown: { "Too Small": 501, "Too Large": 402, "Other": 12 },
        avg_resolution_time_minutes: 760,
      },
      created_at: minus(42),
    },
    {
      id: "00000000-0000-0000-0001-000000000002",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      agent_name: "Merchandising Agent",
      agent_icon: "🛍️",
      summary: "Product page has zero sizing guidance. No size chart, no fit notes. 22.5% sizing return rate is the highest across all 4 trainer SKUs.",
      detail: {
        has_size_guide: false,
        has_fit_assistant: false,
        return_rate_vs_category: { court_trainer: 0.225, category_avg: 0.13 },
        product_id: "prod_00005",
      },
      created_at: minus(41),
    },
    {
      id: "00000000-0000-0000-0001-000000000003",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      agent_name: "Marketing Agent",
      agent_icon: "📣",
      summary: "Meta cold-traffic campaign drove 1,092 first-time buyers. 45.6% of sizing refunds are first-order customers — no purchase history to inform size recommendation.",
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
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      agent_name: "Inventory Agent",
      agent_icon: "🏭",
      summary: "UK11: -153 units, UK12: -150 units, UK6: -149 units. Rebuyers post-return are purchasing larger sizes, exhausting UK11/12 stock.",
      detail: {
        stockouts: { UK11: -153, UK12: -150, UK6: -149 },
        reorder_within_90_days_pct: 0.415,
        reorder_count: 453,
        chain: "Returns → rebuys in larger size → UK11/UK12 stockout",
      },
      created_at: minus(39),
    },
  ], { onConflict: "id" });

  // actions
  await supabase.from("incident_actions").upsert([
    {
      id: "00000000-0000-0000-0002-000000000001",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      title: "Add sizing guidance to product page",
      description: "Publish size chart and fit notes (runs small — size up) to the Court Trainer PDP.",
      impact_level: "high",
      risk_level: "low",
      auto_deploy: true,
      status: "deployed",
      deployed_at: minus(35),
      created_at: minus(38),
    },
    {
      id: "00000000-0000-0000-0002-000000000002",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      title: "Enable fit assistant widget",
      description: "Activate the AI fit recommendation widget on the product page — personalised size suggestion based on past orders.",
      impact_level: "high",
      risk_level: "low",
      auto_deploy: false,
      status: "proposed",
      created_at: minus(38),
    },
    {
      id: "00000000-0000-0000-0002-000000000003",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      title: "Update support flow — exchange before refund",
      description: "Route sizing-related support tickets to exchange offer first. Estimated to recover £8,200 in refunds.",
      impact_level: "medium",
      risk_level: "low",
      auto_deploy: false,
      status: "proposed",
      created_at: minus(37),
    },
    {
      id: "00000000-0000-0000-0002-000000000004",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      title: "Pause cold-traffic Meta campaign",
      description: "Pause 'Womens Launch Prospecting' (ROAS 1.1x) to stop driving unsized first-time buyers until fit assistant is live.",
      impact_level: "high",
      risk_level: "high",
      auto_deploy: false,
      status: "proposed",
      created_at: minus(37),
    },
  ], { onConflict: "id" });

  // timeline
  await supabase.from("incident_timeline").upsert([
    {
      id: "00000000-0000-0000-0003-000000000001",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      event_type: "anomaly_detected",
      description: "Return rate for Court Trainer crossed 20% threshold (current: 22.5%)",
      metadata: { threshold: 0.20, actual: 0.225, product: "Court Trainer" },
      created_at: minus(47),
    },
    {
      id: "00000000-0000-0000-0003-000000000002",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      event_type: "incident_created",
      description: "Incident opened automatically — severity set to High, impact estimated at £66,235",
      created_at: minus(47),
    },
    {
      id: "00000000-0000-0000-0003-000000000003",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      event_type: "agent_assigned",
      description: "4 agents dispatched in parallel: Returns, Merchandising, Marketing, Inventory",
      created_at: minus(45),
    },
    {
      id: "00000000-0000-0000-0003-000000000004",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      event_type: "root_cause_found",
      description: "Root cause identified with 91% confidence — sizing-related returns from cold Meta traffic, no on-page guidance",
      metadata: { confidence: 91 },
      created_at: minus(39),
    },
    {
      id: "00000000-0000-0000-0003-000000000005",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      event_type: "action_proposed",
      description: "4 actions proposed: 1 auto-deploy, 3 requiring approval",
      created_at: minus(38),
    },
    {
      id: "00000000-0000-0000-0003-000000000006",
      owner_user_id: ownerUserId,
      incident_id: incidentId,
      event_type: "deployed",
      description: "Action auto-deployed: sizing guidance published to Court Trainer product page",
      created_at: minus(35),
    },
  ], { onConflict: "id" });

  console.log("  ✓ Incident 1: Court Trainer Return Spike");

  // ── Incident 2: Wasted Ad Spend — already resolved ──────────
  const { data: inc2, error: e2 } = await supabase
    .from("incidents")
    .upsert({
      id: "00000000-0000-0000-0000-000000000002",
      owner_user_id: ownerUserId,
      title: "Wasted Ad Spend — Low-ROAS Campaigns",
      status: "monitoring",
      severity: "medium",
      impact_amount: 112535,
      impact_label: "wasted spend",
      affected_product: null,
      affected_kpis: ["roas", "cac", "blended_margin"],
      root_cause:
        "3 campaigns generating 0–1.2x ROAS burning £112,535: Brand Awareness UK (0x), " +
        "Womens Launch Prospecting (1.1x), Generic Streetwear UK (1.2x). Blended ROAS declining YoY.",
      root_cause_confidence: 88,
      created_at: minus(180),
      investigation_started_at: minus(178),
      fix_proposed_at: minus(172),
    }, { onConflict: "id" })
    .select().single();
  if (!e2) console.log("  ✓ Incident 2: Wasted Ad Spend");

  // ── Incident 3: Inventory Stockout ──────────────────────────
  await supabase.from("incidents").upsert({
    id: "00000000-0000-0000-0000-000000000003",
    owner_user_id: ownerUserId,
    title: "Court Trainer UK11/UK12 Stockout",
    status: "fix_proposed",
    severity: "critical",
    impact_amount: 24800,
    impact_label: "lost revenue",
    affected_product: "prod_00005",
    affected_kpis: ["inventory", "lost_sales", "fulfillment_rate"],
    root_cause:
      "UK11 (-153 units) and UK12 (-150 units) are exhausted. Rebuyers post-sizing-return " +
      "are choosing larger sizes, creating a cascade from the returns incident.",
    root_cause_confidence: 95,
    created_at: minus(90),
    investigation_started_at: minus(88),
    fix_proposed_at: minus(82),
  }, { onConflict: "id" });
  console.log("  ✓ Incident 3: Court Trainer Stockout");

  // ── Incident 4: Low Retention ────────────────────────────────
  await supabase.from("incidents").upsert({
    id: "00000000-0000-0000-0000-000000000004",
    owner_user_id: ownerUserId,
    title: "M3 Customer Retention at 9.5%",
    status: "investigating",
    severity: "high",
    impact_amount: 48200,
    impact_label: "lifetime value lost",
    affected_product: null,
    affected_kpis: ["retention_m3", "ltv", "repeat_order_rate"],
    root_cause: null,
    root_cause_confidence: null,
    created_at: minus(20),
    investigation_started_at: minus(18),
  }, { onConflict: "id" });
  console.log("  ✓ Incident 4: Low Retention");

  console.log("\n  Demo incidents seeded.\n");
}

async function ensureAuthUser(email: string, password: string, label: string): Promise<string | null> {
  console.log(`  ${label}…`);
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && !/already|exists|registered/i.test(error.message)) {
    console.error(`  ✗ ${label}: ${error.message}`);
    return null;
  }

  const userId =
    created.user?.id ??
    (
      await supabase.auth.admin.listUsers()
    ).data.users.find((u) => u.email === email)?.id;

  if (!userId) {
    console.error(`  ✗ ${label}: could not resolve user id`);
    return null;
  }

  console.log(`  ✓ ${label} (${email})`);
  return userId;
}

async function ensureDemoUser(): Promise<string | null> {
  const credentials = resolveDemoCredentials();
  if (!credentials) {
    console.log("  demo user… skipped (set DEMO_USER_* in production)");
    return null;
  }
  return ensureAuthUser(credentials.email, credentials.password, "demo user");
}

async function resolveSeedOwnerUserId(): Promise<string | null> {
  const e2eEmail = process.env.E2E_USER_EMAIL;
  const e2ePassword = process.env.E2E_USER_PASSWORD;
  if (e2eEmail && e2ePassword) {
    return ensureAuthUser(e2eEmail, e2ePassword, "e2e seed owner");
  }
  return ensureDemoUser();
}

// ---- Main ----------------------------------------------------
async function main() {
  console.log("=== Resolve — seed script ===\n");

  try {
    const ownerUserId = await resolveSeedOwnerUserId();
    if (!ownerUserId) {
      console.error("Fatal: seed owner user required (DEMO_USER_* or E2E_USER_*)");
      process.exit(1);
    }
    if (process.env.E2E_USER_EMAIL) {
      await ensureDemoUser();
    }
    await seedRawData(ownerUserId);
    await seedProductKpiThresholds(ownerUserId);
    await seedDemoIncidents(ownerUserId);
    console.log("=== Done ✓ ===\n");
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

main();
