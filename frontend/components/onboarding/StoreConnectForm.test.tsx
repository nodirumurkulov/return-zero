import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import StoreConnectForm from "./StoreConnectForm";

describe("StoreConnectForm", () => {
  it("renders integration grid with Pretty Fly and Shopify", () => {
    renderWithProviders(<StoreConnectForm />);
    expect(screen.getByRole("button", { name: /Connect Pretty Fly demo store/i })).toBeInTheDocument();
    expect(screen.getByText("Pretty Fly")).toBeInTheDocument();
    expect(screen.getByText("Shopify")).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText(/upload/i)).not.toBeInTheDocument();
  });

  it("shows ready badge when mock store is pre-provisioned", () => {
    renderWithProviders(<StoreConnectForm mockStoreReady />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText(/Get started/i)).toBeInTheDocument();
  });
});
