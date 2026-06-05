import { describe, expect, it } from "vitest";
import { Label } from "@/components/ui/label";
import { render, screen } from "@/test/test-utils";

describe("Label", () => {
  it("associates with form control", () => {
    render(
      <>
        <Label htmlFor="field-a">Name</Label>
        <input id="field-a" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
