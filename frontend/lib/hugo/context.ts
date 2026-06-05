import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProductHealth, listCatalogWithThresholds } from "@/lib/stores/analytics/catalog";
import { forecastStockout } from "@/lib/stores/analytics/forecast/predictors";
import { createIncidents, type Incident, type IncidentDetail } from "@/lib/stores/incidents";
import type { Database } from "@/lib/supabase/database.types";

// Mirror the reorder horizon defaults used by the detector/forecast modules.
const LEAD_DAYS_DEFAULT = 71;
const BUFFER_DAYS_DEFAULT = 14;
const OUTFLOW_WINDOW_DAYS = 28;
const INVENTORY_MAX_LINES = 25;

const RESOLVED_STATUSES = new Set(["resolved", "canceled"]);

export function isOpenIncident(incident: Incident): boolean {
  return !RESOLVED_STATUSES.has(incident.status.toLowerCase());
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function formatMoney(amount: number | null, label: string | null): string {
  if (label) return label;
  if (amount == null) return "—";
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}

export function formatIncidentLine(incident: Incident): string {
  const meta = [`severity: ${incident.severity}`, `status: ${incident.status}`];
  if (incident.product_id) meta.push(`product: ${incident.product_id.slice(0, 8)}`);
  const impact = formatMoney(incident.impact_amount, incident.impact_label);
  if (impact !== "—") meta.push(`impact: ${impact}`);
  return `[${shortId(incident.id)}] ${incident.title} (${meta.join(", ")})`;
}

/**
 * Resolve a free-text incident reference (title fragment, product, or id) to a
 * single incident. Returns the match when exactly one is found, otherwise the
 * candidate list so the caller can ask the user to disambiguate. When the
 * reference is empty, candidates are the open incidents.
 */
export async function resolveIncident(
  supabase: SupabaseClient<Database>,
  reference: string | null | undefined,
  organizationId: string,
): Promise<{ match: Incident | null; candidates: Incident[] }> {
  const incidents = await createIncidents(supabase).listIncidents(organizationId);
  const ref = (reference ?? "").trim().toLowerCase();

  if (!ref) {
    const open = incidents.filter(isOpenIncident);
    return { match: open.length === 1 ? open[0] : null, candidates: open };
  }

  const matches = incidents.filter((inc) => {
    const id = inc.id.toLowerCase();
    return (
      id === ref ||
      id.startsWith(ref) ||
      ref.includes(shortId(inc.id)) ||
      inc.title.toLowerCase().includes(ref) ||
      (inc.product_id?.toLowerCase().includes(ref) ?? false) ||
      ref.includes(inc.title.toLowerCase())
    );
  });

  if (matches.length === 1) return { match: matches[0], candidates: matches };

  if (matches.length === 0) {
    const open = incidents.filter(isOpenIncident);
    return { match: open.length === 1 ? open[0] : null, candidates: open };
  }

  return { match: null, candidates: matches };
}

/** Compact, model-friendly summary of currently open incidents. */
export async function buildOpenIncidentsContext(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string> {
  const incidents = await createIncidents(supabase).listIncidents(organizationId);
  const open = incidents.filter(isOpenIncident);
  const resolvedCount = incidents.length - open.length;

  if (open.length === 0) {
    return `There are no open incidents. (${resolvedCount} resolved/canceled in total.)`;
  }

  const lines = open.map((inc) => `- ${formatIncidentLine(inc)}`);
  return [
    `Open incidents (${open.length} of ${incidents.length} total; ${resolvedCount} resolved):`,
    ...lines,
  ].join("\n");
}

/** Detailed context for a single incident: root cause, findings, actions. */
export function buildIncidentDetailContext(detail: IncidentDetail): string {
  const { incident, findings, actions } = detail;
  const lines = [
    `Incident [${shortId(incident.id)}] "${incident.title}"`,
    `- severity: ${incident.severity}, status: ${incident.status}`,
    `- impact: ${formatMoney(incident.impact_amount, incident.impact_label)}`,
    `- affected product: ${incident.product_id ?? "—"}`,
    `- affected KPIs: ${(incident.affected_kpi_keys ?? []).join(", ") || "—"}`,
    `- root cause: ${incident.root_cause ?? "not yet determined"}${
      incident.root_cause_confidence != null
        ? ` (confidence ${Math.round(incident.root_cause_confidence * 100)}%)`
        : ""
    }`,
  ];

  if (findings.length > 0) {
    lines.push(`- findings (${findings.length}):`);
    for (const f of findings) lines.push(`  • ${f.agent_name}: ${f.summary}`);
  }

  if (actions.length > 0) {
    lines.push(`- proposed/applied actions (${actions.length}):`);
    for (const a of actions) {
      lines.push(`  • ${a.title} [risk: ${a.risk_level}, status: ${a.status}]`);
    }
  }

  return lines.join("\n");
}

/** Summary of catalog KPI health, highlighting products that breach thresholds. */
export async function buildCatalogContext(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string> {
  const { products, thresholdsByProduct } = await listCatalogWithThresholds(supabase, organizationId);

  const breaches = products
    .map((p) => ({
      product: p,
      level: computeProductHealth(p, thresholdsByProduct[p.product_id] ?? []),
    }))
    .filter((row) => row.level !== "healthy");

  if (breaches.length === 0) {
    return `All ${products.length} products are within their KPI thresholds (no breaches).`;
  }

  const lines = breaches
    .slice(0, 15)
    .map(
      ({ product, level }) =>
        `- ${product.title} (${product.product_id}) — ${level}: return_rate=${
          product.return_rate ?? "—"
        }, refund_rate=${product.refund_rate ?? "—"}, ad_roas=${product.ad_roas ?? "—"}`,
    );

  return [
    `KPI breaches (${breaches.length} of ${products.length} products):`,
    ...lines,
    breaches.length > 15 ? `…and ${breaches.length - 15} more.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const CATALOG_KEYWORDS =
  /\b(kpi|kpis|metric|metrics|product|products|catalog|return rate|refund|roas|threshold|health|breach)\b/i;

export function wantsCatalog(prompt: string): boolean {
  return CATALOG_KEYWORDS.test(prompt);
}

const INVENTORY_KEYWORDS =
  /\b(stock|stocks|stockout|stocked|inventory|units?|in stock|out of stock|sold out|restock|reorder|running low|run out|on hand|supply|left)\b/i;

export function wantsInventory(prompt: string): boolean {
  return INVENTORY_KEYWORDS.test(prompt);
}

function formatStockoutDays(days: number): string {
  if (!Number.isFinite(days)) return "no decline at current demand";
  return `~${Math.round(days)}d to stockout`;
}

/**
 * Per-product stock levels: current units on hand, recent daily outflow, and the
 * resulting days-to-stockout (reusing the forecast module's reorder logic).
 * Most-urgent products are listed first so low/out-of-stock items always surface.
 */
export async function buildInventoryContext(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string> {
  const [{ data: outflowRows }, { data: productRows }, { data: settingsRows }] = await Promise.all([
    supabase.rpc("product_daily_outflow", {
      p_organization_id: organizationId,
      p_days: OUTFLOW_WINDOW_DAYS,
    }),
    supabase.from("products").select("id, title").eq("organization_id", organizationId),
    supabase.from("business_settings").select("key, value").eq("organization_id", organizationId),
  ]);

  const rows = outflowRows ?? [];
  if (rows.length === 0) {
    return "No inventory data is available for any product.";
  }

  const titleById = new Map((productRows ?? []).map((p) => [p.id, p.title]));
  const settings = new Map((settingsRows ?? []).map((s) => [s.key, s.value]));
  const leadDays = settings.get("lead_time_days") ?? LEAD_DAYS_DEFAULT;
  const bufferDays = settings.get("buffer_days") ?? BUFFER_DAYS_DEFAULT;

  const stock = rows
    .map((r) => {
      const currentUnits = Number(r.current_balance ?? 0);
      const dailyOutflow = Number(r.daily_outflow ?? 0);
      return {
        title: titleById.get(r.product_id) ?? "(untitled product)",
        productId: r.product_id,
        currentUnits,
        dailyOutflow,
        forecast: forecastStockout({ currentUnits, dailyOutflow, leadDays, bufferDays }),
      };
    })
    .sort((a, b) => a.forecast.days_to_stockout - b.forecast.days_to_stockout);

  const outOfStock = stock.filter((s) => s.currentUnits <= 0).length;
  const reorderUrgent = stock.filter((s) => s.forecast.reorder_urgent).length;

  const lines = stock.slice(0, INVENTORY_MAX_LINES).map((s) => {
    const flag = s.currentUnits <= 0 ? " — OUT OF STOCK" : s.forecast.reorder_urgent ? " — reorder urgent" : "";
    return `- ${s.title} (${shortId(s.productId)}): ${Math.round(s.currentUnits)} units in stock, ~${s.dailyOutflow.toFixed(1)} units/day, ${formatStockoutDays(s.forecast.days_to_stockout)}${flag}`;
  });

  return [
    `Inventory / stock (${stock.length} products; ${outOfStock} out of stock, ${reorderUrgent} need reorder within lead+buffer time):`,
    ...lines,
    stock.length > INVENTORY_MAX_LINES
      ? `…and ${stock.length - INVENTORY_MAX_LINES} more — ask about a specific product for its exact stock.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
