import { describe, expect, it } from "vitest";
import ComingSoonLoginButton from "@/components/auth/ComingSoonLoginButton";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("ComingSoonLoginButton", () => {
  it("renders the provider button without a notice", () => {
    renderWithProviders(<ComingSoonLoginButton provider="Microsoft" icon={null} />);
    expect(screen.getByRole("button", { name: /continue with microsoft/i })).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("reveals the coming-soon notice on click", async () => {
    const { user } = renderWithProviders(
      <ComingSoonLoginButton provider="Microsoft" icon={null} />,
    );
    await user.click(screen.getByRole("button", { name: /continue with microsoft/i }));
    expect(screen.getByText(/microsoft login is coming soon/i)).toBeInTheDocument();
  });

  it("uses the provider name in the notice", async () => {
    const { user } = renderWithProviders(<ComingSoonLoginButton provider="Shopify" icon={null} />);
    await user.click(screen.getByRole("button", { name: /continue with shopify/i }));
    expect(screen.getByText(/shopify login is coming soon/i)).toBeInTheDocument();
  });
});
