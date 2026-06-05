import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BusinessProfileForm from "./BusinessProfileForm";

describe("BusinessProfileForm", () => {
  it("renders profile fields from initial data", () => {
    render(
      <BusinessProfileForm
        initialProfile={{
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
        }}
        onSaved={async () => {}}
      />,
    );
    expect(screen.getByLabelText(/Store name/i)).toHaveValue("Pretty Fly");
    expect(screen.getByRole("button", { name: /Save profile & build report/i })).toBeInTheDocument();
  });
});
