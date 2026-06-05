import { Card } from "@/components/ui/card";
import type { AgentFinding } from "@/lib/incidents";

type Stats = {
  z_score?: number;
  sigma?: number;
  ci?: { lower?: number; upper?: number };
  confidence?: string;
  quantity?: number;
};

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** Lift the quant stat fields the pipeline folds into `detail` (if present). */
function readStats(detail: AgentFinding["detail"]): Stats {
  if (!detail || typeof detail !== "object") return {};
  const d = detail as Record<string, unknown>;
  const ciRaw = d.ci as Record<string, unknown> | undefined;
  return {
    z_score: num(d.z_score),
    sigma: num(d.sigma),
    ci:
      ciRaw && typeof ciRaw === "object"
        ? { lower: num(ciRaw.lower), upper: num(ciRaw.upper) }
        : undefined,
    confidence: typeof d.confidence === "string" ? d.confidence : undefined,
    quantity: num(d.quantity),
  };
}

const confidenceStyle: Record<string, string> = {
  high: "border-sev-resolvedBd bg-sev-resolvedBg text-sev-resolved",
  moderate: "border-sev-monitorBd bg-sev-monitorBg text-sev-monitor",
  low: "border-sev-criticalBd bg-sev-criticalBg text-sev-critical",
  none: "border-border bg-muted text-muted-foreground",
};

export default function AgentFindingCard({ finding }: { finding: AgentFinding }) {
  const hasDetail = finding.detail && Object.keys(finding.detail).length > 0;
  const stats = readStats(finding.detail);
  const chips: string[] = [];
  if (stats.z_score !== undefined) chips.push(`z ${stats.z_score.toFixed(2)}`);
  if (stats.sigma !== undefined) chips.push(`σ ${stats.sigma.toFixed(3)}`);
  if (stats.ci?.lower !== undefined && stats.ci?.upper !== undefined) {
    chips.push(`95% CI [${stats.ci.lower.toFixed(2)}, ${stats.ci.upper.toFixed(2)}]`);
  }
  if (stats.quantity !== undefined) chips.push(`qty ${Math.round(stats.quantity)}`);

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary-subtle text-sm text-primary">
          {finding.agent_icon ?? "🤖"}
        </span>
        <span className="text-[12px] font-semibold text-foreground">{finding.agent_name}</span>
        {stats.confidence ? (
          <span
            className={`ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
              confidenceStyle[stats.confidence] ?? confidenceStyle.none
            }`}
          >
            {stats.confidence} confidence
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
        {finding.summary}
      </p>
      {chips.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="tabnum rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}
      {hasDetail ? (
        <details className="mt-3 border-t border-border pt-2.5">
          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
            Raw data
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(finding.detail, null, 2)}
          </pre>
        </details>
      ) : null}
    </Card>
  );
}
