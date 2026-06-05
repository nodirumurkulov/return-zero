import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import { RunAnalysis } from "./RunAnalysis";

describe("RunAnalysis", () => {
  it("renders run analysis button", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWithProviders(<RunAnalysis />);
    expect(screen.getByRole("button", { name: /Run analysis/i })).toBeInTheDocument();
  });
});
