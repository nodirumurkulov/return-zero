import { describe, expect, it, vi, afterEach } from "vitest";
import ActionList from "@/components/incidents/ActionList";
import { createIncidentActionFixture } from "@/test/fixtures";
import { mockRefresh } from "@/test/mocks/navigation";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

describe("ActionList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows empty message when no actions", () => {
    renderWithProviders(<ActionList actions={[]} incidentId="inc-1" />);
    expect(screen.getByText("No actions proposed yet")).toBeInTheDocument();
  });

  it("approves a proposed action and refreshes router", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ approved: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const action = createIncidentActionFixture({
      id: "act-1",
      status: "proposed",
      risk_level: "medium",
    });
    const { user } = renderWithProviders(
      <ActionList actions={[action]} incidentId="inc-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(screen.getByText("Action approved and deployed")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incidents/inc-1/approve",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });
});
