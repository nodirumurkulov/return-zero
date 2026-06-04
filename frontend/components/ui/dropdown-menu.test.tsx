import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("DropdownMenu", () => {
  it("opens menu and shows item on click", async () => {
    const { user } = renderWithProviders(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item one</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(await screen.findByText("Item one")).toBeInTheDocument();
  });
});
