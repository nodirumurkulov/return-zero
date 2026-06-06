import { describe, expect, it, vi } from "vitest";

import { ShopSwitcher } from "@/components/layout/ShopSwitcher";
import { TenancyProvider } from "@/components/providers/TenancyProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createTenancyFixture } from "@/test/fixtures/tenancy";
import { renderWithProviders, screen } from "@/test/test-utils";

vi.mock("@/hooks/tenancy", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useSwitchStore: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

function renderShopSwitcher(tenancy = createTenancyFixture()) {
  return renderWithProviders(
    <TenancyProvider value={tenancy}>
      <SidebarProvider>
        <ShopSwitcher />
      </SidebarProvider>
    </TenancyProvider>,
  );
}

describe("ShopSwitcher", () => {
  it("renders the active store name and platform", () => {
    renderShopSwitcher();
    expect(screen.getByText("Hugo mock store")).toBeInTheDocument();
    expect(screen.getByText("mock csv")).toBeInTheDocument();
  });

  it("opens the menu with connect store disabled", async () => {
    const { user } = renderShopSwitcher();
    await user.click(screen.getByRole("button", { name: /Hugo mock store/i }));

    expect(await screen.findByText("Stores")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /connect store/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
