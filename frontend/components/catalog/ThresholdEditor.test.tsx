import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { updateThreshold } from "@/app/actions";
import ThresholdEditor from "@/components/catalog/ThresholdEditor";
import { createKpiThresholdFixture } from "@/test/fixtures";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

vi.mock("@/app/actions", () => ({
  updateThreshold: vi.fn(),
}));

describe("ThresholdEditor", () => {
  it("shows empty state when no thresholds", () => {
    renderWithProviders(
      <ThresholdEditor productId="prod-1" thresholds={[]} />,
    );
    expect(screen.getByText(/No per-product overrides/i)).toBeInTheDocument();
  });

  it("renders threshold form and shows Saved on success", async () => {
    vi.mocked(updateThreshold).mockResolvedValue({ ok: true });
    const threshold = createKpiThresholdFixture({ metric_key: "return_rate" });
    renderWithProviders(
      <ThresholdEditor productId="prod-1" thresholds={[threshold]} />,
    );

    expect(screen.getByText("Return rate")).toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
    expect(updateThreshold).toHaveBeenCalled();
  });

  it("shows error message when save fails", async () => {
    vi.mocked(updateThreshold).mockResolvedValue({
      ok: false,
      error: "Validation failed",
    });
    const threshold = createKpiThresholdFixture();
    renderWithProviders(
      <ThresholdEditor productId="prod-1" thresholds={[threshold]} />,
    );

    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Validation failed")).toBeInTheDocument();
    });
  });
});
