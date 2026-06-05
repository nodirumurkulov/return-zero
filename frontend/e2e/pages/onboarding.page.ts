import type { Page } from "@playwright/test";

export class OnboardingPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/onboarding");
    await this.page.waitForURL("**/onboarding");
  }

  heading() {
    return this.page.getByRole("heading", { name: "Analyze your store" });
  }

  runAnalysisButton() {
    return this.page.getByRole("button", { name: /Run analysis/i });
  }

  recoveryButton() {
    return this.page.getByRole("button", { name: /Load demo store and analyze/i });
  }
}
