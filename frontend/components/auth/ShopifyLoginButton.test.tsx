import { describe, expect, it } from "vitest";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("ShopifyLoginButton", () => {
  it("renders shop input and submit button", () => {
    renderWithProviders(<ShopifyLoginButton />);

    expect(screen.getByLabelText(/shopify store/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with shopify/i })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("shows validation error for empty shop handle", async () => {
    const { user } = renderWithProviders(<ShopifyLoginButton />);

    await user.click(screen.getByRole("button", { name: /continue with shopify/i }));

    expect(screen.getByText(/enter your shopify store handle/i)).toBeInTheDocument();
  });
});
