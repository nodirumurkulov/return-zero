import { describe, expect, it } from "vitest";
import { Skeleton } from "@/components/ui/skeleton";
import { render } from "@/test/test-utils";

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild).toBeTruthy();
  });
});
