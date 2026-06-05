import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReplayControl } from "./ReplayControl";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("ReplayControl", () => {
  it("advances replay and shows result message", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, cursor: "2024-02-01", created: 2 }),
      }),
    );

    render(<ReplayControl initialCursor="2024-01-01" />);
    await user.click(screen.getByRole("button", { name: "Advance 7 days" }));

    await waitFor(() => {
      expect(screen.getByText(/\+2 new incidents/)).toBeInTheDocument();
    });
    expect(refresh).toHaveBeenCalled();
  });
});
