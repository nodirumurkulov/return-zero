import { describe, expect, it } from "vitest";
import { HealthBadge } from "@/components/catalog/HealthBadge";
import { render, screen } from "@/test/test-utils";

describe("HealthBadge", () => {
  it.each([
    ["healthy", "Healthy"],
    ["warning", "At risk"],
    ["critical", "Critical"],
  ] as const)("renders %s label", (level, label) => {
    render(<HealthBadge level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
