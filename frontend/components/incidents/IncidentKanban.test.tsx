import { describe, expect, it, vi } from "vitest";
import IncidentKanban from "@/components/incidents/IncidentKanban";

vi.mock("@/lib/incidents/hooks", () => ({
  useUpdateIncidentStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
import { createIncidentFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("IncidentKanban", () => {
  it("shows empty state when no incidents", () => {
    render(<IncidentKanban incidents={[]} />);
    expect(screen.getByText("No incidents yet")).toBeInTheDocument();
  });

  it("renders kanban columns with incident cards", () => {
    const incidents = [
      createIncidentFixture({ id: "i1", status: "detected", title: "Issue A" }),
      createIncidentFixture({ id: "i2", status: "investigating", title: "Issue B" }),
    ];
    render(<IncidentKanban incidents={incidents} />);
    expect(screen.getByText("Issue A")).toBeInTheDocument();
    expect(screen.getByText("Issue B")).toBeInTheDocument();
    expect(screen.getAllByText("Detected").length).toBeGreaterThan(0);
  });
});
