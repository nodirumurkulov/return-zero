import { describe, expect, it } from "vitest";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("Collapsible", () => {
  it("renders trigger and content", () => {
    renderWithProviders(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden panel</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText("Toggle")).toBeInTheDocument();
    expect(screen.getByText("Hidden panel")).toBeInTheDocument();
  });
});
