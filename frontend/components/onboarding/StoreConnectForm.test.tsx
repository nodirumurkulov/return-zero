import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/test-utils";

import StoreConnectForm from "./StoreConnectForm";

describe("StoreConnectForm", () => {
  it("renders store choice options", () => {
    renderWithProviders(<StoreConnectForm />);
    expect(screen.getByRole("button", { name: /Use Pretty Fly demo store/i })).toBeInTheDocument();
    expect(screen.getByText(/Pre-loaded catalog, orders, ads/i)).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
  });
});
