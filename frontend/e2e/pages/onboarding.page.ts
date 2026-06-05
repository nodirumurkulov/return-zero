import type { Page } from "@playwright/test";

export class OnboardingPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/onboarding");
    await this.page.waitForURL("**/onboarding");
  }

  heading() {
    return this.page.getByRole("heading", { name: "Connect your store" });
  }

  connectButton() {
    return this.page.getByRole("button", { name: /Use Pretty Fly demo store/i });
  }

  profileSaveButton() {
    return this.page.getByRole("button", { name: /Save profile & build report/i });
  }

  seededProductBanner(count: number) {
    return this.page.getByText(new RegExp(`${count} products loaded`, "i"));
  }
}
