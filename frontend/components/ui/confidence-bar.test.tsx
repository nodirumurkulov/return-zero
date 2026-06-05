import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceBar } from "./confidence-bar";

describe("ConfidenceBar", () => {
  it("clamps and displays percentage", () => {
    render(<ConfidenceBar value={120} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows low confidence values", () => {
    render(<ConfidenceBar value={10} />);
    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});
