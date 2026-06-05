import { describe, expect, it } from "vitest";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { render, screen } from "@/test/test-utils";

describe("Empty primitives", () => {
  it("renders empty layout slots", () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Title</EmptyTitle>
          <EmptyDescription>Description text</EmptyDescription>
        </EmptyHeader>
      </Empty>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });
});
