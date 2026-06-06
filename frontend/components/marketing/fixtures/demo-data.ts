import type { AgentFinding, Incident, ProductMetric } from "@/lib/stores";

const DEMO_ORG = "00000000-0000-0000-0000-000000000100";
const DEMO_STORE = "00000000-0000-0000-0000-000000000200";
const HOUR = 3600000;

function hoursAgo(h: number) {
  return new Date(Date.now() - h * HOUR).toISOString();
}

export const MARKETING_HERO_INCIDENTS: Incident[] = [
  {
    id: "inc-demo-court-trainer",
    organization_id: DEMO_ORG,
    store_id: DEMO_STORE,
    title: "Court Trainer Return Spike",
    status: "investigating",
    severity: "critical",
    impact_amount: 24800,
    impact_label: "est. 14d loss",
    product_id: "prod-court-trainer",
    affected_kpi_keys: ["return_rate", "refund_rate"],
    root_cause: "Sizing mismatch on cold Meta traffic",
    root_cause_confidence: 78,
    monitoring_kpi: null,
    baseline_value: null,
    target_value: null,
    recovery_pct: 0,
    created_at: hoursAgo(6),
    updated_at: hoursAgo(2),
    resolved_at: null,
    investigation_started_at: hoursAgo(5),
    fix_proposed_at: null,
    monitoring_started_at: null,
  },
  {
    id: "inc-demo-roas",
    organization_id: DEMO_ORG,
    store_id: DEMO_STORE,
    title: "ROAS dip — UK cold campaigns",
    status: "detected",
    severity: "high",
    impact_amount: 9200,
    impact_label: "ad waste",
    product_id: "prod-court-trainer",
    affected_kpi_keys: ["ad_roas"],
    root_cause: null,
    root_cause_confidence: null,
    monitoring_kpi: null,
    baseline_value: null,
    target_value: null,
    recovery_pct: 0,
    created_at: hoursAgo(11),
    updated_at: hoursAgo(11),
    resolved_at: null,
    investigation_started_at: null,
    fix_proposed_at: null,
    monitoring_started_at: null,
  },
  {
    id: "inc-demo-stockout",
    organization_id: DEMO_ORG,
    store_id: DEMO_STORE,
    title: "UK12 stockout loop",
    status: "monitoring",
    severity: "medium",
    impact_amount: 4100,
    impact_label: "missed revenue",
    product_id: "prod-court-trainer",
    affected_kpi_keys: ["stock_cover"],
    root_cause: "Returns flooding warehouse picks",
    root_cause_confidence: 64,
    monitoring_kpi: "return_rate",
    baseline_value: 0.042,
    target_value: 0.065,
    recovery_pct: 42,
    created_at: hoursAgo(48),
    updated_at: hoursAgo(1),
    resolved_at: null,
    investigation_started_at: hoursAgo(47),
    fix_proposed_at: hoursAgo(20),
    monitoring_started_at: hoursAgo(8),
  },
];

export const MARKETING_KANBAN_INCIDENTS: Incident[] = [
  MARKETING_HERO_INCIDENTS[0],
  MARKETING_HERO_INCIDENTS[1],
  {
    ...MARKETING_HERO_INCIDENTS[2],
    status: "awaiting_approval",
    title: "Pause Meta UK11 cold set",
  },
];

export const MARKETING_COURT_TRAINER: ProductMetric = {
  product_id: "prod-court-trainer",
  external_id: "court-trainer",
  title: "Court Trainer",
  product_type: "footwear",
  gender_segment: "unisex",
  revenue_gbp: 186400,
  order_count: 2840,
  return_rate: 0.184,
  refund_rate: 0.092,
  support_tickets: 47,
  ad_roas: 0.82,
};

export const MARKETING_FINDINGS: AgentFinding[] = [
  {
    id: "find-demo-returns",
    incident_id: "inc-demo-court-trainer",
    organization_id: DEMO_ORG,
    agent_name: "Returns Analyst",
    agent_icon: "📦",
    summary: "Return rate 18.4% vs 6.5% threshold — UK11/UK12 sizes over-indexed in cold traffic cohort.",
    detail: { z_score: 3.41, confidence: "high" },
    created_at: hoursAgo(4),
  },
  {
    id: "find-demo-marketing",
    incident_id: "inc-demo-court-trainer",
    organization_id: DEMO_ORG,
    agent_name: "Marketing Analyst",
    agent_icon: "📣",
    summary: "ROAS 0.82 on prospecting — creative mismatch with sizing chart on landing page.",
    detail: { confidence: "moderate" },
    created_at: hoursAgo(3),
  },
  {
    id: "find-demo-inventory",
    incident_id: "inc-demo-court-trainer",
    organization_id: DEMO_ORG,
    agent_name: "Inventory Analyst",
    agent_icon: "📊",
    summary: "UK12 cover 4 days at current burn — returns delaying replenishment picks.",
    detail: { quantity: 128, confidence: "high" },
    created_at: hoursAgo(3),
  },
];

export const WORKFLOW_STEPS = [
  {
    status: "detected",
    caption: "KPI breach opens an incident with severity and £ impact.",
  },
  {
    status: "investigating",
    caption: "Parallel agents pull evidence from returns, ads, and inventory.",
  },
  {
    status: "awaiting_approval",
    caption: "Humans review proposed fixes before anything ships.",
  },
  {
    status: "monitoring",
    caption: "Hugo tracks recovery until the metric returns to baseline.",
  },
  {
    status: "resolved",
    caption: "Incident closes with audit trail and learnings.",
  },
] as const;
