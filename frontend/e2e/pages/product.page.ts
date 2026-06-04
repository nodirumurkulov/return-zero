import type { Page } from "@playwright/test";

export class ProductPage {
  constructor(readonly page: Page) {}

  backLink() {
    return this.page.getByRole("link", { name: "← Back to catalog" });
  }

  thresholdInputs() {
    return this.page.locator('input[name="threshold"]');
  }

  saveButtons() {
    return this.page.getByRole("button", { name: "Save" });
  }

  savedMessage() {
    return this.page.getByText("Saved", { exact: true });
  }

  async saveFirstThreshold(newValue: string) {
    const input = this.thresholdInputs().first();
    await input.fill(newValue);
    await this.saveButtons().first().click();
    await this.savedMessage().waitFor({ state: "visible" });
  }
}
