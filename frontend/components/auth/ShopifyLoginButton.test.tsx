import { describe, expect, it } from "vitest";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("ShopifyLoginButton", () => {
  it("renders the Shopify login button without a notice", () => {
    renderWithProviders(<ShopifyLoginButton />);
    const button = screen.getByRole("button", { name: /continue with shopify/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(screen.queryByText(/shopify login is coming soon/i)).not.toBeInTheDocument();
  });

  it("reveals the Shopify placeholder notice on click", async () => {
    const { user } = renderWithProviders(<ShopifyLoginButton />);

    await user.click(screen.getByRole("button", { name: /continue with shopify/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Shopify login is coming soon.");
  });
});
