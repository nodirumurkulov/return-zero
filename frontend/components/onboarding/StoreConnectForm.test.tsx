import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import StoreConnectForm from "./StoreConnectForm";

describe("StoreConnectForm", () => {
  it("shows connect action when store is not connected", () => {
    renderWithProviders(<StoreConnectForm />);
    expect(screen.getByRole("button", { name: /Connect demo store/i })).toBeInTheDocument();
    expect(screen.getByText(/Load the Pretty Fly demo dataset/i)).toBeInTheDocument();
  });

  it("shows connected state and continue action when store is ready", () => {
    renderWithProviders(<StoreConnectForm storeReady />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to catalog/i })).toBeInTheDocument();
  });
});
