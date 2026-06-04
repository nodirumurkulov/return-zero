import { describe, expect, it } from "vitest";
import { Separator } from "@/components/ui/separator";
import { render } from "@/test/test-utils";

describe("Separator", () => {
  it("renders without crashing", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeTruthy();
  });
});
