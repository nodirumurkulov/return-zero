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

  async saveReturnRateThreshold(newValue: string) {
    const form = this.page.locator("form").filter({ hasText: "Return rate" });
    const input = form.locator('input[name="threshold"]');
    await input.fill(newValue);
    await form.getByRole("button", { name: "Save" }).click();
    await this.savedMessage().waitFor({ state: "visible" });
  }

  returnRateThresholdInput() {
    return this.page.locator("form").filter({ hasText: "Return rate" }).locator('input[name="threshold"]');
  }
}
