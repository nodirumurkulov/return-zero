/**
 * Return Zero – Supabase seed script
 *
 * Loads the 4 core CSV files from backend/data/, computes fit scores,
 * then upserts everything into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *   node scripts/seed.mjs
 *
 * The SERVICE_ROLE key is needed to bypass RLS during seeding.
 * Find it in: Supabase dashboard → Settings → API → service_role (secret).
 * Never commit it or expose it in frontend code.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DATA_DIR = join(__dirname, "..", "backend", "data");

function readCsv(filename) {
  const raw = readFileSync(join(DATA_DIR, filename), "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

// ─── Colour hex map ──────────────────────────────────────────────────────────
const COLOUR_HEX = {
  "Washed Black":  "#2A2A2A",
  "Vintage Cream": "#F0EAD6",
  "Charcoal":      "#555555",
  "Sage":          "#8A9E8A",
  "Off-White":     "#F5F5F0",
  "Deep Navy":     "#1B2A4A",
  "Faded Olive":   "#7A8A60",
  "Burgundy":      "#7D2020",
};

// Demo order for storefront display
const DEMO_ORDER = [
  "prod_00005",  // Court Trainer      — Grade F, 22.5%
  "prod_00026",  // Mid Runner Trainer — Grade F, 22.1%
  "prod_00036",  // Canvas Trainer     — Grade F, 21.4%
  "prod_00039",  // Tech Runner        — Grade F, 19.9%
  "prod_00010",  // Heavyweight Hoodie — Grade B
  "prod_00015",  // Track Hoodie       — Grade B
  "prod_00009",  // Arch Logo Tee      — Grade B
  "prod_00001",  // Essential Tee      — Grade A
];

function grade(rate) {
  if (rate <= 2.0)  return "A";
  if (rate <= 5.0)  return "B";
  if (rate <= 10.0) return "C";
  if (rate <= 18.0) return "D";
  return "F";
}

function bias(small, large) {
  if (small === 0 && large === 0) return "unknown";
  const ratio = small / Math.max(small + large, 1);
  if (ratio > 0.52) return "runs_small";
  if (ratio < 0.48) return "runs_large";
  return "true_to_size";
}

async function upsertBatch(table, rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk);
    if (error) {
      console.error(`Error upserting ${table} (chunk ${i}):`, error.message);
      process.exit(1);
    }
    process.stdout.write(`  ${table}: upserted ${Math.min(i + chunkSize, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ${table}: done (${rows.length} rows)        `);
}

async function main() {
  console.log("Loading CSV files…");
  const products   = readCsv("products.csv");
  const variants   = readCsv("variants.csv");
  const orders     = readCsv("orders.csv");
  const lineItems  = readCsv("line_items.csv");
  const refunds    = readCsv("refunds.csv");

  // ── 1. products ──────────────────────────────────────────────────────────
  console.log("\nSeeding products…");
  await upsertBatch("products", products.map(p => ({
    product_id:     p.product_id,
    title:          p.title,
    handle:         p.handle || null,
    description:    p.description || null,
    product_type:   p.product_type || null,
    vendor:         p.vendor || null,
    collection:     p.collection || null,
    gender_segment: p.gender_segment || null,
    tags:           p.tags || null,
    status:         p.status || null,
    created_at:     p.created_at || null,
  })));

  // ── 2. variants ──────────────────────────────────────────────────────────
  console.log("Seeding variants…");
  await upsertBatch("variants", variants.map(v => ({
    variant_id:         v.variant_id,
    product_id:         v.product_id,
    sku:                v.sku || null,
    option1_name:       v.option1_name || null,
    option1_value:      v.option1_value || null,
    option2_name:       v.option2_name || null,
    option2_value:      v.option2_value || null,
    price:              v.price ? parseFloat(v.price) : null,
    compare_at_price:   v.compare_at_price ? parseFloat(v.compare_at_price) : null,
    barcode:            v.barcode || null,
    weight_grams:       v.weight_grams ? parseInt(v.weight_grams) : null,
    inventory_quantity: v.inventory_quantity ? parseInt(v.inventory_quantity) : 0,
  })));

  // ── 3. orders ────────────────────────────────────────────────────────────
  console.log("Seeding orders…");
  await upsertBatch("orders", orders.map(o => ({
    order_id:           o.order_id,
    order_number:       o.order_number ? parseInt(o.order_number) : null,
    customer_id:        o.customer_id || null,
    created_at:         o.created_at || null,
    currency:           o.currency || null,
    subtotal:           o.subtotal ? parseFloat(o.subtotal) : null,
    total_discounts:    o.total_discounts ? parseFloat(o.total_discounts) : null,
    total_shipping:     o.total_shipping ? parseFloat(o.total_shipping) : null,
    total_tax:          o.total_tax ? parseFloat(o.total_tax) : null,
    total_price:        o.total_price ? parseFloat(o.total_price) : null,
    financial_status:   o.financial_status || null,
    fulfillment_status: o.fulfillment_status || null,
    utm_source:         o.utm_source || null,
    utm_medium:         o.utm_medium || null,
    utm_campaign:       o.utm_campaign || null,
    landing_site:       o.landing_site || null,
    referring_site:     o.referring_site || null,
    tags:               o.tags || null,
    discount_code:      o.discount_code || null,
  })));

  // ── 4. line_items ────────────────────────────────────────────────────────
  console.log("Seeding line_items…");
  await upsertBatch("line_items", lineItems.map(li => ({
    line_item_id:   li.line_item_id,
    order_id:       li.order_id,
    variant_id:     li.variant_id || null,
    product_id:     li.product_id || null,
    title:          li.title || null,
    quantity:       li.quantity ? parseInt(li.quantity) : null,
    price:          li.price ? parseFloat(li.price) : null,
    total_discount: li.total_discount ? parseFloat(li.total_discount) : null,
  })));

  // ── 5. refunds ───────────────────────────────────────────────────────────
  console.log("Seeding refunds…");
  await upsertBatch("refunds", refunds.map(r => ({
    refund_id:          r.refund_id,
    order_id:           r.order_id || null,
    created_at:         r.created_at || null,
    amount:             r.amount ? parseFloat(r.amount) : null,
    reason:             r.reason || null,
    refund_line_items:  r.refund_line_items || null,
  })));

  // ── 6. Compute & upsert fit_scores ────────────────────────────────────────
  console.log("Computing fit scores…");

  // Build lookup maps
  const variantMap = {};
  for (const v of variants) {
    variantMap[v.variant_id] = v;
  }

  // Units sold per product
  const unitsSold = {};
  for (const li of lineItems) {
    if (!li.product_id) continue;
    unitsSold[li.product_id] = (unitsSold[li.product_id] || 0) + parseInt(li.quantity || "0");
  }

  // Sizing refund counts per product
  const tooSmall = {};
  const tooLarge = {};
  for (const r of refunds) {
    if (!["size_too_small", "size_too_large"].includes(r.reason)) continue;
    let variantIds = [];
    try {
      variantIds = JSON.parse(r.refund_line_items || "[]");
    } catch {
      continue;
    }
    for (const vid of variantIds) {
      const v = variantMap[vid];
      if (!v) continue;
      const pid = v.product_id;
      if (r.reason === "size_too_small") tooSmall[pid] = (tooSmall[pid] || 0) + 1;
      if (r.reason === "size_too_large") tooLarge[pid] = (tooLarge[pid] || 0) + 1;
    }
  }

  // Inventory by size per product
  const invByProduct = {};
  for (const v of variants) {
    if (!v.product_id || !v.option1_value) continue;
    if (!invByProduct[v.product_id]) invByProduct[v.product_id] = {};
    invByProduct[v.product_id][v.option1_value] =
      (invByProduct[v.product_id][v.option1_value] || 0) + parseInt(v.inventory_quantity || "0");
  }

  // Colours per product
  const coloursByProduct = {};
  for (const v of variants) {
    if (!v.product_id || !v.option2_value) continue;
    if (!coloursByProduct[v.product_id]) coloursByProduct[v.product_id] = new Set();
    coloursByProduct[v.product_id].add(v.option2_value);
  }

  // Min price per product
  const minPrice = {};
  for (const v of variants) {
    if (!v.product_id || !v.price) continue;
    const p = parseFloat(v.price);
    if (minPrice[v.product_id] === undefined || p < minPrice[v.product_id]) {
      minPrice[v.product_id] = p;
    }
  }

  // Build fit_scores rows
  const fitScoreRows = products.map((p, idx) => {
    const pid    = p.product_id;
    const sm     = tooSmall[pid] || 0;
    const lg     = tooLarge[pid] || 0;
    const total  = sm + lg;
    const sold   = unitsSold[pid] || 0;
    const rate   = sold > 0 ? Math.round((total / sold) * 1000) / 10 : 0;
    const inv    = invByProduct[pid] || {};
    const outs   = Object.entries(inv).filter(([, q]) => q < 0).map(([s]) => s);
    const colours = coloursByProduct[pid] ? [...coloursByProduct[pid]] : [];
    const hexes  = colours.map(c => COLOUR_HEX[c] || "#999");
    const demoIdx = DEMO_ORDER.indexOf(pid);

    return {
      product_id:           pid,
      title:                p.title,
      product_type:         p.product_type || null,
      gender_segment:       p.gender_segment || null,
      price:                minPrice[pid] || null,
      colours:              colours,
      colour_hexes:         hexes,
      sizing_return_rate:   rate,
      fit_score:            grade(rate),
      size_bias:            bias(sm, lg),
      size_too_small:       sm,
      size_too_large:       lg,
      total_sizing_refunds: total,
      units_sold:           sold,
      inventory_by_size:    inv,
      stockout_sizes:       outs,
      stockout_count:       outs.length,
      demo_order:           demoIdx >= 0 ? demoIdx : 999,
    };
  });

  console.log("Seeding fit_scores…");
  await upsertBatch("fit_scores", fitScoreRows);

  console.log("\nSeed complete!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
