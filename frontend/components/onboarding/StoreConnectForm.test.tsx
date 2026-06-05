import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import StoreConnectForm from "./StoreConnectForm";

describe("StoreConnectForm", () => {
  it("shows recovery path when demo store is not ready", () => {
    renderWithProviders(<StoreConnectForm />);
    expect(screen.getByRole("button", { name: /Load demo store and analyze/i })).toBeInTheDocument();
    expect(screen.getByText(/did not finish loading/i)).toBeInTheDocument();
  });

  it("shows ready state and run analysis when mock store is pre-provisioned", () => {
    renderWithProviders(<StoreConnectForm mockStoreReady />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run analysis/i })).toBeInTheDocument();
    expect(screen.getByText(/Connected at signup/i)).toBeInTheDocument();
  });
});
