import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { ShopSwitcher } from "@/components/layout/ShopSwitcher";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DEMO_SHOPS } from "@/lib/organizations/demo-shops";
import { renderWithProviders, screen } from "@/test/test-utils";

function renderShopSwitcher(
  props: Partial<ComponentProps<typeof ShopSwitcher>> = {},
) {
  return renderWithProviders(
    <SidebarProvider>
      <ShopSwitcher shops={DEMO_SHOPS} switchingEnabled={false} {...props} />
    </SidebarProvider>,
  );
}

describe("ShopSwitcher", () => {
  it("renders the active store name and plan", () => {
    renderShopSwitcher();
    expect(screen.getByText("Pretty Fly")).toBeInTheDocument();
    expect(screen.getByText("Demo store")).toBeInTheDocument();
  });

  it("opens the menu with disabled store actions when switching is off", async () => {
    const { user } = renderShopSwitcher();
    await user.click(screen.getByRole("button", { name: /pretty fly/i }));

    expect(await screen.findByText("Stores")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /pretty fly/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("menuitem", { name: /connect store/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
