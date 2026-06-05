import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OAuthButtons from "./OAuthButtons";

vi.mock("@/app/auth/actions", () => ({
  signInWithProvider: vi.fn(),
}));

describe("OAuthButtons", () => {
  it("renders Google and Microsoft provider buttons", () => {
    render(<OAuthButtons />);
    expect(screen.getByRole("button", { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Microsoft/i })).toBeInTheDocument();
  });
});
