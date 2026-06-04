import { describe, expect, it, vi, afterEach } from "vitest";
import TriggerInvestigationButton from "@/components/incidents/TriggerInvestigationButton";
import { mockRefresh } from "@/test/mocks/navigation";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

describe("TriggerInvestigationButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("triggers investigation and refreshes on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { user } = renderWithProviders(
      <TriggerInvestigationButton incidentId="inc-1" productId="prod-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Trigger Investigation" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/investigate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            incident_id: "inc-1",
            product_id: "prod-1",
          }),
        }),
      );
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows error when investigation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "LLM unavailable" }),
      }),
    );

    const { user } = renderWithProviders(
      <TriggerInvestigationButton incidentId="inc-1" productId="prod-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Trigger Investigation" }));

    await waitFor(() => {
      expect(screen.getByText("LLM unavailable")).toBeInTheDocument();
    });
  });
});
