import { describe, expect, it } from "vitest";
import CatalogEmpty from "@/components/catalog/CatalogEmpty";
import { render, screen } from "@/test/test-utils";

describe("CatalogEmpty", () => {
  it("renders empty catalog message", () => {
    render(<CatalogEmpty />);
    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(
      screen.getByText(/Try a different search term/i),
    ).toBeInTheDocument();
  });
});
