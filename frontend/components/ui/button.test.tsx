import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { render, screen } from "@/test/test-utils";

describe("Button", () => {
  it("renders a clickable button", () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });
});
