import { afterEach, describe, expect, it, vi } from "vitest";
import type { LlmAgentFinding } from "./types";

const findings: LlmAgentFinding[] = [
  {
    agent_name: "Inventory Agent",
    agent_icon: "📦",
    summary: "Womens Logo Cap stockout in ~6 days",
    detail: { sku: "prod_00012" },
  },
];

describe("synthesiseRootCause", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses deterministic synthesis when no LLM key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { synthesiseRootCause } = await import("./synthesise");
    const result = await synthesiseRootCause(findings);
    expect(result.root_cause).toContain("Womens Logo Cap");
    expect(result.actions.length).toBeGreaterThan(0);
  });
});
