import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { render, screen } from "@/test/test-utils";

describe("StatusBadge", () => {
  it("renders known status label", () => {
    render(<StatusBadge status="investigating" />);
    expect(screen.getByText("Investigating")).toBeInTheDocument();
  });

  it("renders raw status when unknown", () => {
    render(<StatusBadge status="custom_status" />);
    expect(screen.getByText("custom_status")).toBeInTheDocument();
  });
});
