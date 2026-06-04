import { describe, expect, it } from "vitest";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { createIncidentDetailFixture, createIncidentFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("IncidentDetailView", () => {
  it("renders incident title and root cause", () => {
    const detail = createIncidentDetailFixture({
      incident: createIncidentFixture({
        title: "Major return spike",
        root_cause: "Supplier defect in batch 12",
        root_cause_confidence: 90,
        affected_kpis: ["return_rate"],
      }),
      findings: [],
      actions: [],
      timeline: [],
    });
    render(<IncidentDetailView detail={detail} />);
    expect(screen.getByRole("heading", { name: "Major return spike" })).toBeInTheDocument();
    expect(screen.getByText("Supplier defect in batch 12")).toBeInTheDocument();
    expect(screen.getByText("return_rate")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Incidents/i })).toHaveAttribute(
      "href",
      "/incidents",
    );
  });
});
