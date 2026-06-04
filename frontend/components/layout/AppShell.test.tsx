import * as navigation from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import AppShell from "@/components/layout/AppShell";
import { createShellUserFixture } from "@/test/fixtures";
import { render, screen } from "@/test/test-utils";

describe("AppShell", () => {
  it("renders navigation and user info", () => {
    const user = createShellUserFixture({
      name: "Alex Ops",
      email: "alex@prettyfly.test",
    });
    render(
      <AppShell user={user}>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /Catalog/i })).toHaveAttribute(
      "href",
      "/catalog",
    );
    expect(screen.getByRole("link", { name: /Incidents/i })).toHaveAttribute(
      "href",
      "/incidents",
    );
    expect(screen.getByText("Alex Ops")).toBeInTheDocument();
    expect(screen.getByText("alex@prettyfly.test")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("marks catalog nav active when pathname matches", () => {
    vi.mocked(navigation.usePathname).mockReturnValue("/catalog");
    const user = createShellUserFixture();
    render(
      <AppShell user={user}>
        <span>child</span>
      </AppShell>,
    );
    expect(screen.getAllByRole("link", { name: /Catalog/i })[0]).toHaveAttribute(
      "href",
      "/catalog",
    );
  });
});
