import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProductHealth, listCatalogWithThresholds } from "@/lib/catalog";
import { type Incident, type IncidentDetail, listIncidents } from "@/lib/incidents";
import { getCurrentOrganizationId } from "@/lib/organizations/queries";

const RESOLVED_STATUSES = new Set(["resolved", "closed"]);

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
  supabase: SupabaseClient,
  reference: string | null | undefined,
): Promise<{ match: Incident | null; candidates: Incident[] }> {
  const incidents = await listIncidents(supabase);
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

  // No textual match: fall back to open incidents as disambiguation candidates.
  if (matches.length === 0) {
    const open = incidents.filter(isOpenIncident);
    return { match: open.length === 1 ? open[0] : null, candidates: open };
  }

  return { match: null, candidates: matches };
}

/** Compact, model-friendly summary of currently open incidents. */
export async function buildOpenIncidentsContext(supabase: SupabaseClient): Promise<string> {
  const incidents = await listIncidents(supabase);
  const open = incidents.filter(isOpenIncident);
  const resolvedCount = incidents.length - open.length;

  if (open.length === 0) {
    return `There are no open incidents. (${resolvedCount} resolved/closed in total.)`;
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
export async function buildCatalogContext(supabase: SupabaseClient): Promise<string> {
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return "No organization context — catalog KPIs unavailable.";
  }
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
