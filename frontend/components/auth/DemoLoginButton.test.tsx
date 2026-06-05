import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DemoLoginButton from "./DemoLoginButton";

vi.mock("@/app/auth/actions", () => ({
  signInAsDemo: vi.fn(),
}));

describe("DemoLoginButton", () => {
  it("renders an enabled demo sign-in submit button", () => {
    render(<DemoLoginButton />);
    const button = screen.getByRole("button", { name: /Continue as Pretty Fly/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Continue as Pretty Fly");
    expect(button).toBeEnabled();
  });

  it("never leaks developer setup instructions to end users", () => {
    render(<DemoLoginButton />);
    expect(screen.queryByText(/DEMO_USER_EMAIL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bun run seed/i)).not.toBeInTheDocument();
  });
});
