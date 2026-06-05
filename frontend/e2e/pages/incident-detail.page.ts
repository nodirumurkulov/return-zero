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
    // Section labels in the Hugo design are styled <Label>s, not <h*> headings.
    return this.page.getByText(name, { exact: true });
  }

  approveAllLowRiskButton() {
    return this.page.getByTestId("approve-all-low-risk");
  }

  approveButtons() {
    return this.page.getByTestId("approve-action");
  }

  approveActionButton(actionTitle: string) {
    return this.page.getByRole("button", { name: `Approve action: ${actionTitle}` });
  }

  triggerInvestigationButton() {
    return this.page.getByRole("button", { name: "Trigger Investigation" });
  }

  successAlert() {
    return this.page.getByRole("status").filter({ hasText: /approved/i });
  }
}
