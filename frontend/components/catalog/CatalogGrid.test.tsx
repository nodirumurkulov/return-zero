import { describe, expect, it } from "vitest";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import { createProductMetricFixture } from "@/test/fixtures";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

describe("CatalogGrid", () => {
  it("renders product cards for each product", () => {
    const products = [
      createProductMetricFixture({ product_id: "p1", title: "Alpha Tee" }),
      createProductMetricFixture({ product_id: "p2", title: "Beta Hoodie" }),
    ];
    renderWithProviders(
      <CatalogGrid products={products} thresholdsByProduct={{}} />,
    );
    expect(screen.getByText("Alpha Tee")).toBeInTheDocument();
    expect(screen.getByText("Beta Hoodie")).toBeInTheDocument();
    expect(screen.getByText(/2 products/)).toBeInTheDocument();
  });

  it("filters products by search query", async () => {
    const products = [
      createProductMetricFixture({ product_id: "p1", title: "Alpha Tee" }),
      createProductMetricFixture({ product_id: "p2", title: "Beta Hoodie" }),
    ];
    const { user } = renderWithProviders(
      <CatalogGrid products={products} thresholdsByProduct={{}} />,
    );
    await user.type(screen.getByPlaceholderText(/Search products/i), "Beta");
    await waitFor(() => {
      expect(screen.getByText("Beta Hoodie")).toBeInTheDocument();
    });
    expect(screen.queryByText("Alpha Tee")).not.toBeInTheDocument();
  });
});
