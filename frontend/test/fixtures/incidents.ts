import type {
  AgentFinding,
  Incident,
  IncidentAction,
  IncidentDetail,
  TimelineEvent,
} from "@/lib/stores";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000100";
const DEMO_STORE_ID = "00000000-0000-0000-0000-000000000101";

export function createIncidentFixture(overrides?: Partial<Incident>): Incident {
  return {
    id: "inc-00000000-0000-0000-0000-000000000001",
    organization_id: DEMO_ORG_ID,
    store_id: DEMO_STORE_ID,
    title: "Return rate spike on SKU-42",
    status: "detected",
    severity: "high",
    impact_amount: 12500,
    impact_label: "estimated loss",
    product_id: "00000000-0000-0000-0000-000000000005",
    affected_kpi_keys: ["return_rate", "refund_rate"],
    root_cause: "Supplier batch defect",
    root_cause_confidence: 85,
    monitoring_kpi: null,
    baseline_value: null,
    target_value: null,
    recovery_pct: 0,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    resolved_at: null,
    investigation_started_at: null,
    fix_proposed_at: null,
    monitoring_started_at: null,
    ...overrides,
  };
}

export function createIncidentActionFixture(
  overrides?: Partial<IncidentAction>,
): IncidentAction {
  return {
    id: "act-00000000-0000-0000-0000-000000000001",
    organization_id: DEMO_ORG_ID,
    incident_id: "inc-00000000-0000-0000-0000-000000000001",
    title: "Pause ads for affected SKU",
    description: "Reduce spend until returns normalize",
    impact_level: "high",
    risk_level: "low",
    auto_deploy: false,
    status: "proposed",
    approved_by_user_id: null,
    approved_at: null,
    deployed_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createAgentFindingFixture(
  overrides?: Partial<AgentFinding>,
): AgentFinding {
  return {
    id: "find-00000000-0000-0000-0000-000000000001",
    incident_id: "inc-00000000-0000-0000-0000-000000000001",
    organization_id: DEMO_ORG_ID,
    agent_name: "Returns Analyst",
    agent_icon: "📦",
    summary: "Return rate 3.2× baseline over 7 days",
    detail: { delta: 2.1 },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createAnomalyDetectedEventFixture(
  overrides?: Partial<TimelineEvent>,
): TimelineEvent {
  return createTimelineEventFixture({
    event_type: "anomaly_detected",
    description: "Return rate 22.5% exceeded threshold ≤20.0%",
    metadata: {
      breaches: [
        {
          metric: "return_rate",
          display_name: "Return rate",
          unit: "ratio",
          value: 0.225,
          threshold: 0.2,
          direction: "above",
        },
        {
          metric: "refund_rate",
          display_name: "Refund rate",
          unit: "ratio",
          value: 0.141,
          threshold: 0.12,
          direction: "above",
        },
      ],
      quant: { z_score: 2.34, confidence: "high" },
    },
    ...overrides,
  });
}

export function createTimelineEventFixture(
  overrides?: Partial<TimelineEvent>,
): TimelineEvent {
  return {
    id: "evt-00000000-0000-0000-0000-000000000001",
    incident_id: "inc-00000000-0000-0000-0000-000000000001",
    organization_id: DEMO_ORG_ID,
    event_type: "incident_created",
    description: "Incident opened from KPI breach",
    metadata: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createIncidentDetailFixture(
  overrides?: Partial<IncidentDetail>,
): IncidentDetail {
  return {
    incident: createIncidentFixture(overrides?.incident),
    findings: overrides?.findings ?? [createAgentFindingFixture()],
    actions: overrides?.actions ?? [],
    timeline: overrides?.timeline ?? [createTimelineEventFixture()],
  };
}
