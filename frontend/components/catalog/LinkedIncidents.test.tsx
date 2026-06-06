import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createIncidentFixture } from "@/test/fixtures";
import LinkedIncidents from "./LinkedIncidents";

describe("LinkedIncidents", () => {
  it("shows linked incidents with status and links", () => {
    const incidents = [
      createIncidentFixture({
        id: "inc-open",
        title: "Return rate spike",
        status: "investigating",
        severity: "high",
        impact_amount: 4200,
      }),
      createIncidentFixture({
        id: "inc-resolved",
        title: "Sizing complaints",
        status: "resolved",
        severity: "medium",
        impact_amount: null,
      }),
    ];

    render(<LinkedIncidents incidents={incidents} />);

    expect(screen.getByText("Linked incidents")).toBeInTheDocument();
    expect(screen.getByText(/1 open · 2 total/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return rate spike/ })).toHaveAttribute(
      "href",
      "/incidents/inc-open",
    );
    expect(screen.getByText("Investigating")).toBeInTheDocument();
    expect(screen.getByText(/£4,200/)).toBeInTheDocument();
  });

  it("shows empty state when there are no incidents", () => {
    render(<LinkedIncidents incidents={[]} />);
    expect(screen.getByText("No incidents linked to this product")).toBeInTheDocument();
    expect(
      screen.getByText("Incidents tied to this product will appear here."),
    ).toBeInTheDocument();
  });
});
