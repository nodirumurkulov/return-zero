import type { InvestigationAction, LlmAgentFinding } from "./types";

/** Build a root cause narrative and actions from agent summaries when the LLM is unavailable. */
export function synthesiseDeterministicRootCause(findings: LlmAgentFinding[]): {
  root_cause: string;
  root_cause_confidence: number;
  actions: InvestigationAction[];
} {
  const highlights = findings
    .map((f) => `${f.agent_name}: ${f.summary}`)
    .filter((s) => s.length > 0)
    .join(" ");

  const root_cause =
    highlights.length > 0
      ? `Deterministic review of live store data points to: ${highlights}`
      : "Incident detected from KPI thresholds. Automated agent narration is unavailable until an LLM API key is configured.";

  const actions: InvestigationAction[] = findings.slice(0, 3).map((f, i) => ({
    title: `Review ${f.agent_name.replace(/ Agent$/, "")} signal`,
    description: f.summary,
    impact_level: i === 0 ? "high" : "medium",
    risk_level: "low",
    auto_deploy: false,
  }));

  if (actions.length === 0) {
    actions.push({
      title: "Review incident metrics",
      description: "Open the affected product and confirm which KPI breached the learned threshold.",
      impact_level: "medium",
      risk_level: "low",
      auto_deploy: false,
    });
  }

  return { root_cause, root_cause_confidence: 65, actions };
}
