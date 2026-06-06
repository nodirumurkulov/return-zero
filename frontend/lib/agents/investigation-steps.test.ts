import { describe, expect, it } from "vitest";

import {
  deriveRunStatus,
  investigationToolLabel,
} from "@/lib/agents/investigation-steps";

describe("investigationToolLabel", () => {
  it("maps known tools to friendly labels", () => {
    expect(investigationToolLabel("getAnomalyProfile")).toBe("Checking anomaly profile");
    expect(investigationToolLabel("getBusinessProfile")).toBe("Reading business profile");
  });

  it("falls back to tool name", () => {
    expect(investigationToolLabel("customTool")).toBe("Calling customTool");
  });
});

describe("deriveRunStatus", () => {
  it("returns idle when there are no steps", () => {
    expect(deriveRunStatus("detected", [])).toBe("idle");
  });

  it("returns running while incident is investigating", () => {
    expect(deriveRunStatus("investigating", [{ status: "done" }])).toBe("running");
  });

  it("returns error when any step failed", () => {
    expect(
      deriveRunStatus("detected", [{ status: "done" }, { status: "error" }]),
    ).toBe("error");
  });

  it("returns complete when incident moved on and steps finished", () => {
    expect(
      deriveRunStatus("fix_proposed", [{ status: "done" }, { status: "done" }]),
    ).toBe("complete");
  });
});
