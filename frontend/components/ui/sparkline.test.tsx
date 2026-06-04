import { describe, expect, it } from "vitest";
import Sparkline from "@/components/ui/sparkline";
import { render } from "@/test/test-utils";

describe("Sparkline", () => {
  it("renders empty container when data is empty", () => {
    const { container } = render(<Sparkline data={[]} className="h-10" />);
    expect(container.querySelector("div")).toBeTruthy();
    expect(container.querySelector("[data-testid='recharts-container']")).toBeNull();
  });

  it("renders chart when data is provided", () => {
    const { getByTestId } = render(
      <Sparkline data={[1, 2, 3]} className="h-10 w-full" />,
    );
    expect(getByTestId("recharts-container")).toBeInTheDocument();
  });
});
