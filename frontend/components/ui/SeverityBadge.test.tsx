import { describe, expect, it } from "vitest";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { render, screen } from "@/test/test-utils";

describe("SeverityBadge", () => {
  it.each([
    ["critical", "Critical"],
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
  ] as const)("renders %s severity", (severity, label) => {
    render(<SeverityBadge severity={severity} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("defaults missing severity to medium styling label", () => {
    render(<SeverityBadge severity={undefined as unknown as string} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });
});
