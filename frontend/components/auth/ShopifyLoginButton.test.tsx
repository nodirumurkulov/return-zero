import { describe, expect, it } from "vitest";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("ShopifyLoginButton", () => {
  it("renders the Shopify button without a notice", () => {
    renderWithProviders(<ShopifyLoginButton />);
    expect(screen.getByRole("button", { name: /continue with shopify/i })).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("reveals the coming-soon notice on click", async () => {
    const { user } = renderWithProviders(<ShopifyLoginButton />);
    await user.click(screen.getByRole("button", { name: /continue with shopify/i }));
    expect(screen.getByText(/shopify login is coming soon/i)).toBeInTheDocument();
  });
});
