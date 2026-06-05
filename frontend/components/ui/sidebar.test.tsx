import { describe, expect, it } from "vitest";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { render, screen } from "@/test/test-utils";

describe("Sidebar", () => {
  it("renders sidebar within provider", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Nav</SidebarHeader>
          <SidebarContent>Links</SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByText("Nav")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
  });
});
