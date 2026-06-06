import { describe, expect, it } from "vitest";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { createIncidentDetailFixture, createIncidentFixture } from "@/test/fixtures";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("IncidentDetailView", () => {
  it("renders incident title and root cause", () => {
    const detail = createIncidentDetailFixture({
      incident: createIncidentFixture({
        title: "Major return spike",
        root_cause: "Supplier defect in batch 12",
        root_cause_confidence: 90,
        affected_kpi_keys: ["return_rate"],
      }),
      findings: [],
      actions: [],
      timeline: [],
    });

    renderWithProviders(<IncidentDetailView detail={detail} />);
    expect(screen.getByRole("heading", { name: "Major return spike" })).toBeInTheDocument();
    expect(screen.getByText("Supplier defect in batch 12")).toBeInTheDocument();
    expect(screen.getByText("return_rate")).toBeInTheDocument();
  });
});
