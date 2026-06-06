import { expect, type Page } from "@playwright/test";

export class IncidentsPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/incidents");
  }

  heading() {
    return this.page.getByRole("heading", { name: "Open incidents" });
  }

  incidentLink(title: string) {
    return this.page.getByRole("link", { name: title });
  }

  statusTriggerFor(title: string) {
    return this.page
      .locator('[data-testid="incident-card"]')
      .filter({ has: this.incidentLink(title) })
      .getByTestId("incident-status-trigger");
  }

  async changeStatus(title: string, statusLabel: string) {
    const patchResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        /\/api\/stores\/incidents\//.test(response.url()),
    );
    await this.statusTriggerFor(title).click();
    const item = this.page.getByRole("menuitem").filter({ hasText: statusLabel });
    await item.waitFor({ state: "visible" });
    await item.click();
    const response = await patchResponse;
    expect(response.ok()).toBe(true);
  }
}
