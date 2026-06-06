import { describe, expect, it } from "vitest";
import DetectionReasonCard from "@/components/incidents/DetectionReasonCard";
import type { DetectionReason } from "@/lib/incidents/format-detection-reason";
import { render, screen } from "@/test/test-utils";

const breachReason: DetectionReason = {
  kind: "breach",
  summary: "Return rate 22.5% exceeded threshold ≤20.0%",
  lines: [
    { label: "Return rate", detail: "22.5% (target ≤20.0%)" },
    { label: "Refund rate", detail: "14.1% (target ≤12.0%)" },
  ],
  stats: { z_score: 2.34, confidence: "high" },
};

describe("DetectionReasonCard", () => {
  it("renders summary and breach lines", () => {
    render(<DetectionReasonCard reason={breachReason} />);
    expect(screen.getByText("Why this was detected")).toBeInTheDocument();
    expect(screen.getByText("Return rate 22.5% exceeded threshold ≤20.0%")).toBeInTheDocument();
    expect(screen.getByText("22.5% (target ≤20.0%)")).toBeInTheDocument();
    expect(screen.getByText("z 2.34")).toBeInTheDocument();
    expect(screen.getByText("high confidence")).toBeInTheDocument();
  });

  it("shows investigation in progress message", () => {
    render(<DetectionReasonCard reason={breachReason} investigating />);
    expect(screen.getByText("Investigation in progress…")).toBeInTheDocument();
  });
});
