import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DemoLoginButton from "./DemoLoginButton";

vi.mock("@/app/auth/actions", () => ({
  signInAsDemo: vi.fn(),
}));

describe("DemoLoginButton", () => {
  it("renders enabled demo sign-in submit button when configured", () => {
    render(<DemoLoginButton configured />);
    const button = screen.getByRole("button", { name: /Continue as Pretty Fly/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Continue as Pretty Fly");
    expect(button).toBeEnabled();
  });

  it("disables submit and shows setup hint when not configured", () => {
    render(<DemoLoginButton configured={false} />);
    expect(screen.getByRole("button", { name: /Continue as Pretty Fly/i })).toBeDisabled();
    expect(screen.getByText(/DEMO_USER_EMAIL/i)).toBeInTheDocument();
  });
});
