import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthForm from "@/components/auth/AuthForm";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";

describe("AuthForm", () => {
  it("renders email and password fields", () => {
    renderWithProviders(
      <AuthForm title="Sign in" action={vi.fn().mockResolvedValue(undefined)} />,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows initial error", () => {
    renderWithProviders(
      <AuthForm
        title="Sign in"
        action={vi.fn()}
        initialError="Invalid credentials"
      />,
    );
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows error from action on submit", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false as const, error: "Bad password" });
    const { user } = renderWithProviders(<AuthForm title="Sign in" action={action} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Bad password")).toBeInTheDocument();
    });
    expect(action).toHaveBeenCalled();
  });

  it("shows a success notice from the action on submit", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ ok: true as const, message: "Account created. Check your email." });
    const { user } = renderWithProviders(
      <AuthForm title="Create account" action={action} />,
    );

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Account created. Check your email.")).toBeInTheDocument();
    });
    expect(action).toHaveBeenCalled();
  });
});
