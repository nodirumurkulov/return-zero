import { describe, expect, it } from "vitest";
import { synthesiseDeterministicRootCause } from "./deterministic-synthesis";
import type { LlmAgentFinding } from "./types";

describe("synthesiseDeterministicRootCause", () => {
  it("builds root cause and actions from agent summaries", () => {
    const findings: LlmAgentFinding[] = [
      {
        agent_name: "Returns Agent",
        agent_icon: "↩",
        summary: "Return rate at 18.2% vs 12% threshold",
        detail: {},
      },
      {
        agent_name: "Marketing Agent",
        agent_icon: "📣",
        summary: "PMax_Menswear ROAS at 1.4x vs 3.0x target",
        detail: {},
      },
    ];

    const result = synthesiseDeterministicRootCause(findings);

    expect(result.root_cause).toContain("Return rate at 18.2%");
    expect(result.root_cause).toContain("PMax_Menswear ROAS");
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.root_cause_confidence).toBeGreaterThan(0);
  });

  it("returns a fallback action when no findings exist", () => {
    const result = synthesiseDeterministicRootCause([]);
    expect(result.actions).toHaveLength(1);
    expect(result.root_cause).toContain("LLM API key");
  });
});
