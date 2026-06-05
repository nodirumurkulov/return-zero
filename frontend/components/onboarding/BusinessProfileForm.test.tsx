import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, waitFor } from "@/test/test-utils";

import BusinessProfileForm from "./BusinessProfileForm";

describe("BusinessProfileForm", () => {
  it("renders profile fields after loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          Response.json({
            profile: {
              platform: "shopify",
              storeName: "Pretty Fly",
              primaryGoal: "growth",
              targetMarginPct: 55,
              minRoas: 3,
              leadTimeDays: 71,
              bufferDays: 14,
              heroProductIds: [],
            },
            productCosts: [],
          }),
        ),
      ),
    );

    renderWithProviders(<BusinessProfileForm onSaved={() => {}} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Store name/i)).toHaveValue("Pretty Fly");
    });
    expect(screen.getByRole("button", { name: /Save profile & build report/i })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
