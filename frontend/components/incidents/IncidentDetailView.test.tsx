import { describe, expect, it, vi } from "vitest";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { createIncidentDetailFixture, createIncidentFixture } from "@/test/fixtures";
import { renderWithProviders, screen } from "@/test/test-utils";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
  };
});

describe("IncidentDetailView", () => {
  it("renders loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
    });
    renderWithProviders(<IncidentDetailView incidentId="inc-1" />);
    expect(screen.getByText("Loading incident…")).toBeInTheDocument();
  });

  it("renders incident title and root cause when loaded", () => {
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
    mockUseQuery.mockReturnValue({
      data: detail,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<IncidentDetailView incidentId={detail.incident.id} />);
    expect(screen.getByRole("heading", { name: "Major return spike" })).toBeInTheDocument();
    expect(screen.getByText("Supplier defect in batch 12")).toBeInTheDocument();
    expect(screen.getByText("return_rate")).toBeInTheDocument();
  });
});
