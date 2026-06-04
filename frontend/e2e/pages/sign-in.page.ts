import type { Page } from "@playwright/test";

export class SignInPage {
  constructor(readonly page: Page) {}

  async goto(next?: string) {
    const path = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
    await this.page.goto(path);
  }

  emailInput() {
    return this.page.locator("#auth-email");
  }

  passwordInput() {
    return this.page.locator("#auth-password");
  }

  submitButton() {
    return this.page.getByRole("button", { name: "Sign in" });
  }

  async signIn(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  errorAlert() {
    return this.page.getByRole("alert");
  }
}
