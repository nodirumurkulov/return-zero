import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DemoLoginButton from "./DemoLoginButton";

vi.mock("@/app/auth/actions", () => ({
  signInAsDemo: vi.fn(),
}));

describe("DemoLoginButton", () => {
  it("renders demo sign-in submit button", () => {
    render(<DemoLoginButton />);
    const button = screen.getByRole("button", { name: /Continue as Pretty Fly/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Continue as Pretty Fly (demo)");
  });
});
