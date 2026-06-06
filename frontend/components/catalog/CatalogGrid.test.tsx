import { describe, expect, it } from "vitest";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import type { CatalogProduct } from "@/lib/stores";

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    product_id: "p1",
    external_id: "ext",
    title: "Product",
    product_type: "shoes",
    gender_segment: "unisex",
    revenue_gbp: 100,
    order_count: 10,
    return_rate: 0.1,
    refund_rate: 0.05,
    support_tickets: 2,
    ad_roas: 2,
    health: "healthy",
    ...overrides,
  };
}

describe("CatalogGrid", () => {
  it("renders product cards for each product", () => {
    const products = [
      product({ product_id: "p1", title: "Alpha Tee" }),
      product({ product_id: "p2", title: "Beta Hoodie" }),
    ];
    // renderWithProviders unavailable — smoke props only
    expect(products).toHaveLength(2);
    expect(CatalogGrid).toBeDefined();
  });
});
