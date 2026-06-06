import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HUGO_MOCK_STORE_NAME } from "@/lib/tenancy";
import { renderWithProviders } from "@/test/test-utils";

import StoreConnectForm from "./StoreConnectForm";

describe("StoreConnectForm", () => {
  it("shows platform grid with Shopify connect and mock connect actions", () => {
    renderWithProviders(<StoreConnectForm />);

    expect(screen.getByTestId("store-option-shopify")).toBeInTheDocument();
    expect(screen.getByTestId("store-option-mock_csv")).toBeInTheDocument();
    expect(screen.getByText("Shopify")).toBeInTheDocument();
    expect(screen.getByText(HUGO_MOCK_STORE_NAME)).toBeInTheDocument();
    expect(screen.getByLabelText(/store handle/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect Shopify/i })).toBeInTheDocument();
    expect(screen.getByText(/Load the Hugo mock dataset/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect mock store/i })).toBeInTheDocument();
  });

  it("shows connected mock card and continue action when store is ready", () => {
    renderWithProviders(<StoreConnectForm storeReady />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to catalog/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Connect mock store/i })).not.toBeInTheDocument();
  });
});
