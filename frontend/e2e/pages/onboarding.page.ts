import type { Page } from "@playwright/test";

export class OnboardingPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/onboarding");
    await this.page.waitForURL("**/onboarding");
  }

  heading() {
    return this.page.getByRole("heading", { name: "Connect your data" });
  }

  uploadButton() {
    return this.page.getByRole("button", { name: /^Upload/i });
  }

  profileSaveButton() {
    return this.page.getByRole("button", { name: /Save profile & build report/i });
  }

  fileInput() {
    return this.page.locator('input[type="file"]');
  }

  // Select CSVs by name (content is irrelevant when the upload API is mocked).
  async chooseFiles(names: string[]) {
    await this.fileInput().setInputFiles(
      names.map((name) => ({ name, mimeType: "text/csv", buffer: Buffer.from("id\n1\n") })),
    );
  }

  seededProductBanner(count: number) {
    return this.page.getByText(new RegExp(`${count} products loaded`, "i"));
  }
}
