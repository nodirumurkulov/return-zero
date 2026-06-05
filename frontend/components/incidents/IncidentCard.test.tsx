import { describe, expect, it, vi } from "vitest";
import IncidentCard from "@/components/incidents/IncidentCard";
import { createIncidentFixture } from "@/test/fixtures";
import { renderWithProviders, screen } from "@/test/test-utils";

vi.mock("@/lib/stores/incidents/hooks", async () => {
  const actual = await vi.importActual("@/lib/stores/incidents/hooks");
  return {
    ...actual,
    useUpdateIncidentStatus: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

describe("IncidentCard", () => {
  it("renders title link and impact", () => {
    const incident = createIncidentFixture({
      title: "Refund spike",
      impact_amount: 5000,
      affected_kpi_keys: ["refund_rate", "return_rate", "support_volume", "extra"],
    });
    renderWithProviders(<IncidentCard incident={incident} />);
    expect(screen.getByRole("link", { name: "Refund spike" })).toHaveAttribute(
      "href",
      `/incidents/${incident.id}`,
    );
    expect(screen.getByText(/£5,000/)).toBeInTheDocument();
    expect(screen.getByText("refund_rate")).toBeInTheDocument();
    expect(screen.queryByText("extra")).not.toBeInTheDocument();
  });

  it("shows status dropdown when editable", () => {
    const incident = createIncidentFixture({ status: "detected" });
    renderWithProviders(<IncidentCard incident={incident} editable />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Detected")).toBeInTheDocument();
  });

  it("shows confidence bar when not editable", () => {
    const incident = createIncidentFixture({
      root_cause_confidence: 72,
      root_cause: "Batch issue",
    });
    renderWithProviders(<IncidentCard incident={incident} />);
    expect(screen.getByText("72%")).toBeInTheDocument();
  });
});
