import { describe, expect, it } from "vitest";
import KpiCard from "@/components/catalog/KpiCard";
import { render, screen } from "@/test/test-utils";

describe("KpiCard", () => {
  it("renders label and value", () => {
    render(<KpiCard label="Return rate" value="4.2%" subtext="30-day rolling" />);
    expect(screen.getByText("Return rate")).toBeInTheDocument();
    expect(screen.getByText("4.2%")).toBeInTheDocument();
    expect(screen.getByText("30-day rolling")).toBeInTheDocument();
  });

  it("renders sparkline when trend has more than one point", () => {
    render(<KpiCard label="Revenue" value="£42k" trend={[1, 2, 3, 4]} />);
    expect(screen.getByTestId("recharts-container")).toBeInTheDocument();
  });

  it("does not render sparkline for single-point trend", () => {
    const { container } = render(<KpiCard label="Revenue" value="£42k" trend={[1]} />);
    expect(container.querySelector("[data-testid='recharts-container']")).toBeNull();
  });
});
