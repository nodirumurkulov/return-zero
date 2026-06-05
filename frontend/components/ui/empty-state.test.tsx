import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/empty-state";
import { render, screen } from "@/test/test-utils";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="Nothing here" description="Add items to get started" />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add items to get started")).toBeInTheDocument();
  });
});
