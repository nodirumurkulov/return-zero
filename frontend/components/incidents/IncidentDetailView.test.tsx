import { describe, expect, it } from "vitest";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import {
  createAnomalyDetectedEventFixture,
  createIncidentDetailFixture,
  createIncidentFixture,
} from "@/test/fixtures";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("IncidentDetailView", () => {
  it("renders incident title and root cause", () => {
    const detail = createIncidentDetailFixture({
      incident: createIncidentFixture({
        title: "Major return spike",
        status: "fix_proposed",
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

  it("shows detection reason only for detected incidents without empty investigation sections", () => {
    const detail = createIncidentDetailFixture({
      incident: createIncidentFixture({
        title: "Court Trainer Return Spike",
        status: "detected",
        root_cause: null,
        root_cause_confidence: null,
        affected_kpi_keys: ["return_rate", "refund_rate"],
      }),
      findings: [],
      actions: [],
      timeline: [createAnomalyDetectedEventFixture()],
    });

    renderWithProviders(<IncidentDetailView detail={detail} />);
    expect(screen.getByText("Why this was detected")).toBeInTheDocument();
    expect(screen.getAllByText("22.5% (target ≤20.0%)").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("No findings yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Recommended actions")).not.toBeInTheDocument();
    expect(screen.queryByText("return_rate")).not.toBeInTheDocument();
  });
});
