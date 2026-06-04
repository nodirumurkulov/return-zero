import type { Page } from "@playwright/test";

export class IncidentDetailPage {
  constructor(readonly page: Page) {}

  async goto(incidentId: string) {
    await this.page.goto(`/incidents/${incidentId}`);
  }

  backLink() {
    return this.page.getByRole("link", { name: "← Incidents" });
  }

  sectionHeading(name: string) {
    return this.page.getByRole("heading", { name });
  }

  approveAllLowRiskButton() {
    return this.page.getByTestId("approve-all-low-risk");
  }

  approveButtons() {
    return this.page.getByTestId("approve-action");
  }

  triggerInvestigationButton() {
    return this.page.getByRole("button", { name: "Trigger Investigation" });
  }

  successAlert() {
    return this.page.locator('[role="alert"]').filter({ hasText: /approved/i });
  }
}
