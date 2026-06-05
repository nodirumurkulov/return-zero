import type { Page } from "@playwright/test";

export class AppShellPage {
  constructor(readonly page: Page) {}

  catalogLink() {
    return this.page.getByRole("link", { name: "Catalog" });
  }

  incidentsLink() {
    return this.page.getByRole("link", { name: "Incidents" });
  }

  signOutButton() {
    return this.page.getByRole("button", { name: "Sign out" });
  }

  sidebarToggleTrigger() {
    return this.page.locator('[data-sidebar="trigger"]');
  }

  async goToCatalog() {
    await this.catalogLink().click();
    await this.page.waitForURL("**/catalog");
  }

  async goToIncidents() {
    await this.incidentsLink().click();
    await this.page.waitForURL("**/incidents");
  }

  async signOut() {
    await this.signOutButton().click();
    await this.page.waitForURL("**/sign-in");
  }
}
