import { describe, expect, it } from "vitest";
import { ImpactTag } from "@/components/ui/ImpactTag";
import { render, screen } from "@/test/test-utils";

describe("ImpactTag", () => {
  it("renders formatted GBP amount and label", () => {
    render(<ImpactTag amount={12500} label="est. loss" />);
    expect(screen.getByText(/£12,500/)).toBeInTheDocument();
    expect(screen.getByText("est. loss")).toBeInTheDocument();
  });

  it("renders nothing when amount is null", () => {
    const { container } = render(<ImpactTag amount={null} label="est. loss" />);
    expect(container).toBeEmptyDOMElement();
  });
});
