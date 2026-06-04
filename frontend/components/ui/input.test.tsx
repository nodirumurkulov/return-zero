import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";
import { render, screen } from "@/test/test-utils";

describe("Input", () => {
  it("renders an input with placeholder", () => {
    render(<Input placeholder="Search…" />);
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });
});
