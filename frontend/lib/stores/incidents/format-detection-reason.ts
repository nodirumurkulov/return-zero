import type { Incident, TimelineEvent } from "@/lib/stores/incidents/types";

export type DetectionReason = {
  kind: "breach" | "forecast" | "simple";
  summary: string;
  lines: { label: string; detail: string }[];
  stats?: { z_score?: number; confidence?: string };
};

type BreachRow = {
  metric?: string;
  display_name?: string;
  unit?: string;
  value?: number | null;
  threshold?: number;
  direction?: string;
};

const DETECTION_EVENT_TYPES = new Set(["anomaly_detected", "incident_created"]);

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

export function fmtMetricValue(unit: string | undefined, value: number): string {
  const u = unit ?? "ratio";
  if (u === "ratio" || u === "percentage") return `${(value * 100).toFixed(1)}%`;
  if (u === "currency") return `£${Math.round(value).toLocaleString("en-GB")}`;
  return `${Math.round(value)}`;
}

function targetLabel(direction: string | undefined, unit: string | undefined, threshold: number): string {
  const sym = direction === "below" ? "≥" : "≤";
  return `${sym}${fmtMetricValue(unit, threshold)}`;
}

function humanizeMetricKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function breachLabel(b: BreachRow): string {
  if (typeof b.display_name === "string" && b.display_name.length > 0) return b.display_name;
  if (typeof b.metric === "string") return humanizeMetricKey(b.metric);
  return "Metric";
}

function formatBreachLine(b: BreachRow): { label: string; detail: string } {
  const label = breachLabel(b);
  const value = b.value ?? 0;
  const threshold = b.threshold ?? 0;
  const unit = b.unit;
  const target = targetLabel(b.direction, unit, threshold);
  return {
    label,
    detail: `${fmtMetricValue(unit, value)} (target ${target})`,
  };
}

function readQuantStats(meta: Record<string, unknown>): DetectionReason["stats"] | undefined {
  const quant = meta.quant;
  if (!quant || typeof quant !== "object") return undefined;
  const q = quant as Record<string, unknown>;
  const z = num(q.z_score);
  const confidence = typeof q.confidence === "string" ? q.confidence : undefined;
  if (z === undefined && !confidence) return undefined;
  return { z_score: z, confidence };
}

function parseBreachMetadata(meta: Record<string, unknown>): DetectionReason | null {
  const raw = meta.breaches;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const breaches = raw.filter((b): b is BreachRow => b != null && typeof b === "object");
  const lines = breaches.map(formatBreachLine);
  const primary = breaches[0];
  const primaryLabel = breachLabel(primary);
  const primaryValue = primary.value ?? 0;
  const primaryThreshold = primary.threshold ?? 0;
  const target = targetLabel(primary.direction, primary.unit, primaryThreshold);

  return {
    kind: "breach",
    summary: `${primaryLabel} ${fmtMetricValue(primary.unit, primaryValue)} exceeded threshold ${target}`,
    lines,
    stats: readQuantStats(meta),
  };
}

function parseForecastMetadata(meta: Record<string, unknown>): DetectionReason | null {
  if (meta.forecast !== true) return null;
  const raw = meta.risks;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const risks = raw.filter((r): r is Record<string, unknown> => r != null && typeof r === "object");
  const lines = risks.map((r) => ({
    label: typeof r.kind === "string" ? humanizeMetricKey(r.kind) : "Risk",
    detail: typeof r.message === "string" ? r.message : "Forecast risk detected",
  }));
  const summary = lines[0]?.detail ?? "Forecast risk detected";

  return { kind: "forecast", summary, lines };
}

function parseSimpleMetadata(meta: Record<string, unknown>): DetectionReason | null {
  const actual = num(meta.actual);
  const threshold = num(meta.threshold);
  if (actual === undefined || threshold === undefined) return null;

  const product = typeof meta.product === "string" ? meta.product : "Product";
  const pctActual = `${(actual * 100).toFixed(1)}%`;
  const pctThreshold = `${(threshold * 100).toFixed(0)}%`;

  return {
    kind: "simple",
    summary: `Return rate for ${product} crossed ${pctThreshold} threshold (current: ${pctActual})`,
    lines: [{ label: "Return rate", detail: `${pctActual} (threshold ${pctThreshold})` }],
  };
}

export function formatDetectionReasonFromMetadata(
  metadata: TimelineEvent["metadata"],
): DetectionReason | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const meta = metadata as Record<string, unknown>;

  return (
    parseBreachMetadata(meta) ??
    parseForecastMetadata(meta) ??
    parseSimpleMetadata(meta)
  );
}

export function formatDetectionReasonFromEvent(event: TimelineEvent): DetectionReason | null {
  const fromMeta = formatDetectionReasonFromMetadata(event.metadata);
  if (fromMeta) return fromMeta;
  if (DETECTION_EVENT_TYPES.has(event.event_type) && event.description) {
    return {
      kind: "simple",
      summary: event.description,
      lines: [],
    };
  }
  return null;
}

export function getDetectionReason(
  timeline: TimelineEvent[],
  incident?: Pick<Incident, "title">,
): DetectionReason | null {
  const breachEvent = timeline.find(
    (e) => DETECTION_EVENT_TYPES.has(e.event_type) && e.metadata != null,
  );
  if (breachEvent) {
    const reason = formatDetectionReasonFromEvent(breachEvent);
    if (reason) return reason;
  }

  const detectionDesc = timeline.find((e) => DETECTION_EVENT_TYPES.has(e.event_type));
  if (detectionDesc?.description) {
    return {
      kind: "simple",
      summary: detectionDesc.description,
      lines: [],
    };
  }

  if (incident?.title) {
    return {
      kind: "simple",
      summary: incident.title,
      lines: [],
    };
  }

  return null;
}
