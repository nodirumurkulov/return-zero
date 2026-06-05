import { describe, expect, it } from "vitest";
import { SectionLabel } from "@/components/ui/section-label";
import { render, screen } from "@/test/test-utils";

describe("SectionLabel", () => {
  it("renders label text", () => {
    render(<SectionLabel>KPI thresholds</SectionLabel>);
    expect(screen.getByText("KPI thresholds")).toBeInTheDocument();
  });
});
