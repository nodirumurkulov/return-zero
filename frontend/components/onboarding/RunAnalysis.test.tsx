import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RunAnalysis } from "./RunAnalysis";

describe("RunAnalysis", () => {
  it("renders run analysis button", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<RunAnalysis />);
    expect(screen.getByRole("button", { name: /Run analysis/i })).toBeInTheDocument();
  });
});
