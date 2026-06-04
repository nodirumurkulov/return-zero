import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { render, screen } from "@/test/test-utils";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Open</Badge>);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});
