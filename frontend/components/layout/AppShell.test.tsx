import * as navigation from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import AppShell from "@/components/layout/AppShell";
import { TenancyProvider } from "@/components/providers/TenancyProvider";
import { createShellUserFixture } from "@/test/fixtures";
import { createTenancyFixture } from "@/test/fixtures/tenancy";
import { renderWithProviders, render, screen } from "@/test/test-utils";

function renderAppShell(ui: React.ReactNode, showStoreSwitcher = false) {
  const user = createShellUserFixture({
    name: "Alex Ops",
    email: "alex@prettyfly.test",
  });

  const shell = (
    <AppShell user={user} searchTargets={[]} showStoreSwitcher={showStoreSwitcher}>
      {ui}
    </AppShell>
  );

  if (!showStoreSwitcher) {
    return render(shell);
  }

  return renderWithProviders(<TenancyProvider value={createTenancyFixture()}>{shell}</TenancyProvider>);
}

describe("AppShell", () => {
  it("renders navigation and user info", () => {
    renderAppShell(<p>Page content</p>, true);

    expect(screen.getByRole("link", { name: /Catalog/i })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /Incidents/i })).toHaveAttribute("href", "/incidents");
    expect(screen.getByText("Hugo mock store")).toBeInTheDocument();
    expect(screen.getByText("Alex Ops")).toBeInTheDocument();
    expect(screen.getByText("alex@prettyfly.test")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("marks catalog nav active when pathname matches", () => {
    vi.mocked(navigation.usePathname).mockReturnValue("/catalog");
    renderAppShell(<span>child</span>);
    expect(screen.getAllByRole("link", { name: /Catalog/i })[0]).toHaveAttribute("href", "/catalog");
  });
});
