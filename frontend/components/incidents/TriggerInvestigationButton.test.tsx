import { describe, expect, it, vi } from "vitest";
import TriggerInvestigationButton from "@/components/incidents/TriggerInvestigationButton";
import { renderWithProviders, screen } from "@/test/test-utils";

const { mutate, mockError } = vi.hoisted(() => ({
  mutate: vi.fn(),
  mockError: { current: null as Error | null },
}));

vi.mock("@/hooks/agents", () => ({
  useTriggerInvestigation: () => ({
    mutate,
    isPending: false,
    get error() {
      return mockError.current;
    },
  }),
}));

describe("TriggerInvestigationButton", () => {
  it("triggers investigation mutation on click", async () => {
    mockError.current = null;
    const { user } = renderWithProviders(
      <TriggerInvestigationButton incidentId="inc-1" productId="prod-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Trigger Investigation" }));

    expect(mutate).toHaveBeenCalledWith({ product: { id: "prod-1" } });
  });

  it("shows error when mutation failed", () => {
    mockError.current = new Error("LLM unavailable");
    renderWithProviders(
      <TriggerInvestigationButton incidentId="inc-1" productId="prod-1" />,
    );
    expect(screen.getByText("LLM unavailable")).toBeInTheDocument();
  });
});
