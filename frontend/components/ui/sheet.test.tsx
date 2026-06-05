import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("Sheet", () => {
  it("opens sheet content on trigger click", async () => {
    const { user } = renderWithProviders(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Panel title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(await screen.findByText("Panel title")).toBeInTheDocument();
  });
});
