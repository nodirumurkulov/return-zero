import { describe, expect, it, vi } from "vitest";

import InvestigationLivePanel from "@/components/incidents/InvestigationLivePanel";
import { render, screen } from "@/test/test-utils";

const useInvestigationStepsMock = vi.fn();

vi.mock("@/hooks/agents", () => ({
  useInvestigationSteps: (args: unknown) => useInvestigationStepsMock(args),
}));

describe("InvestigationLivePanel", () => {
  it("renders nothing when inactive", () => {
    useInvestigationStepsMock.mockReturnValue(null);
    const { container } = render(
      <InvestigationLivePanel incidentId="inc-1" active={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows live steps when active", () => {
    useInvestigationStepsMock.mockReturnValue({
      run_id: "run-1",
      run_status: "running",
      steps: [
        {
          id: "step-1",
          step_key: "quant:dispatched",
          agent_name: "Quant Analyst",
          label: "Quant Analyst dispatched",
          status: "done",
          created_at: "2026-06-06T00:00:00.000Z",
          updated_at: "2026-06-06T00:00:01.000Z",
        },
        {
          id: "step-2",
          step_key: "quant:getAnomalyProfile",
          agent_name: "Quant Analyst",
          label: "Checking anomaly profile",
          status: "running",
          created_at: "2026-06-06T00:00:02.000Z",
          updated_at: "2026-06-06T00:00:02.000Z",
        },
      ],
    });

    render(<InvestigationLivePanel incidentId="inc-1" active />);

    expect(screen.getByTestId("investigation-live-panel")).toBeInTheDocument();
    expect(screen.getByText("Hugo is investigating")).toBeInTheDocument();
    expect(screen.getByText("Checking anomaly profile")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
