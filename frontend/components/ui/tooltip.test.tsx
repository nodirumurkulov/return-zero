import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("Tooltip", () => {
  it("renders trigger within provider", () => {
    renderWithProviders(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });
});
