import { describe, expect, it } from "vitest";
import IncidentKanban from "@/components/incidents/IncidentKanban";
import { createIncidentFixture } from "@/test/fixtures";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("IncidentKanban", () => {
  it("shows empty state when no incidents", () => {
    renderWithProviders(<IncidentKanban incidents={[]} />);
    expect(screen.getByText("No incidents yet")).toBeInTheDocument();
  });

  it("renders kanban columns with incident cards", () => {
    const incidents = [
      createIncidentFixture({ id: "i1", status: "detected", title: "Issue A" }),
      createIncidentFixture({ id: "i2", status: "investigating", title: "Issue B" }),
    ];
    renderWithProviders(<IncidentKanban incidents={incidents} />);
    expect(screen.getByText("Issue A")).toBeInTheDocument();
    expect(screen.getByText("Issue B")).toBeInTheDocument();
    expect(screen.getAllByText("Detected").length).toBeGreaterThan(0);
  });
});
