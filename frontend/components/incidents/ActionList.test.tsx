import { describe, expect, it, vi } from "vitest";
import ActionList from "@/components/incidents/ActionList";
import { createIncidentActionFixture } from "@/test/fixtures";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

const mutate = vi.fn();

vi.mock("@/lib/stores/incidents/hooks", async () => {
  const actual = await vi.importActual("@/lib/stores/incidents/hooks");
  return {
    ...actual,
    useApproveActions: () => ({
      mutate,
      isPending: false,
    }),
  };
});

describe("ActionList", () => {
  it("shows empty message when no actions", () => {
    renderWithProviders(<ActionList actions={[]} incidentId="inc-1" />);
    expect(screen.getByText("No actions proposed yet")).toBeInTheDocument();
  });

  it("calls approve mutation for a proposed action", async () => {
    mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.({ approval: { approvedCount: 1 } });
    });

    const action = createIncidentActionFixture({
      id: "act-1",
      status: "proposed",
      risk_level: "medium",
    });
    const { user } = renderWithProviders(
      <ActionList actions={[action]} incidentId="inc-1" />,
    );

    await user.click(
      screen.getByRole("button", { name: /Approve action: Pause ads/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Action approved and deployed")).toBeInTheDocument();
    });
    expect(mutate).toHaveBeenCalledWith(
      { approval: { kind: "action_ids", actionIds: ["act-1"] } },
      expect.any(Object),
    );
  });
});
