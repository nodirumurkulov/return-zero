import { describe, expect, it } from "vitest";
import ProductCatalogCard from "@/components/catalog/ProductCatalogCard";
import { createProductMetricFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("ProductCatalogCard", () => {
  it("renders product title and catalog link", () => {
    const product = createProductMetricFixture({
      product_id: "prod-abc",
      title: "Classic Tee",
    });
    render(<ProductCatalogCard product={product} health="healthy" />);
    expect(screen.getByText("Classic Tee")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/catalog/prod-abc");
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });
});
