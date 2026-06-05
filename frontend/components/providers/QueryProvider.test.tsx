import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QueryProvider from "./QueryProvider";

describe("QueryProvider", () => {
  it("renders children inside query client context", () => {
    render(
      <QueryProvider>
        <p>child content</p>
      </QueryProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
