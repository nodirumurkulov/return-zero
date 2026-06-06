import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReplayControl } from "./ReplayControl";

const refresh = vi.fn();
const mutateAsync = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/hooks/stores/orders", () => ({
  useAdvanceReplay: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

describe("ReplayControl", () => {
  it("advances replay and shows result message", async () => {
    mutateAsync.mockResolvedValue({
      cursor: "2024-02-01",
      previousCursor: "2024-01-01",
      atEnd: false,
      created: 2,
      reset: false,
    });

    const user = userEvent.setup();
    render(<ReplayControl initialCursor="2024-01-01" />);
    await user.click(screen.getByRole("button", { name: "Advance 7 days" }));

    await waitFor(() => {
      expect(screen.getByText(/\+2 new incidents/)).toBeInTheDocument();
    });
    expect(mutateAsync).toHaveBeenCalledWith({ advance_days: 7 });
    expect(refresh).toHaveBeenCalled();
  });
});
