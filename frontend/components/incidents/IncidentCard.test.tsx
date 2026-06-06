import { describe, expect, it } from "vitest";
import IncidentCard from "@/components/incidents/IncidentCard";
import { createIncidentFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("IncidentCard", () => {
  it("renders title link and meta line with impact", () => {
    const incident = createIncidentFixture({
      title: "Refund spike",
      impact_amount: 5000,
    });
    render(<IncidentCard incident={incident} interactive={false} />);
    expect(screen.getByRole("link", { name: /Refund spike/ })).toHaveAttribute(
      "href",
      `/incidents/${incident.id}`,
    );
    expect(screen.getByText(/£5,000/)).toBeInTheDocument();
  });

  it("renders time without impact when impact is absent", () => {
    const incident = createIncidentFixture({
      title: "Minor drift",
      impact_amount: null,
    });
    render(<IncidentCard incident={incident} interactive={false} />);
    expect(screen.getByRole("link", { name: /Minor drift/ })).toBeInTheDocument();
    expect(screen.queryByText(/£/)).not.toBeInTheDocument();
  });
});
