import { describe, expect, it } from "vitest";

import { HUGO_MOCK_STORE_NAME } from "@/lib/organizations/mock-store";
import { renderWithProviders, screen } from "@/test/test-utils";

import DemoLoginButton from "./DemoLoginButton";

describe("DemoLoginButton", () => {
  it("renders demo login action", () => {
    renderWithProviders(<DemoLoginButton />);
    const button = screen.getByRole("button", { name: new RegExp(HUGO_MOCK_STORE_NAME, "i") });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(HUGO_MOCK_STORE_NAME);
  });
});
