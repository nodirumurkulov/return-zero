import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OAuthButtons from "./OAuthButtons";

vi.mock("@/app/auth/actions", () => ({
  signInWithProvider: vi.fn(),
}));

describe("OAuthButtons", () => {
  it("renders the Google provider button", () => {
    render(<OAuthButtons />);
    expect(screen.getByRole("button", { name: /Google/i })).toBeInTheDocument();
  });

  it("does not render a real Microsoft OAuth button", () => {
    render(<OAuthButtons />);
    expect(screen.queryByRole("button", { name: /Microsoft/i })).not.toBeInTheDocument();
  });
});
