import { expect, test } from "@playwright/test";
import {
  E2E_DETECTED_INCIDENT_ID,
  E2E_DETECTED_INCIDENT_TITLE,
  MAIN_INCIDENT_ID,
  MAIN_INCIDENT_TITLE,
} from "../constants";
import { IncidentDetailPage } from "../pages/incident-detail.page";
import { resetAllE2eFixtures } from "../reset-main-incident";

test.describe.configure({ mode: "serial" });

test.describe("Incident detail", () => {
  test.beforeEach(async () => {
    await resetAllE2eFixtures();
  });
  test("shows findings and proposed actions", async ({ page }) => {
    const detail = new IncidentDetailPage(page);
    await detail.goto(MAIN_INCIDENT_ID);

    await expect(page.getByRole("heading", { name: MAIN_INCIDENT_TITLE })).toBeVisible();
    await expect(detail.sectionHeading("Agent findings")).toBeVisible();
    await expect(detail.sectionHeading("Recommended actions")).toBeVisible();
    await expect(page.getByText("Returns Agent")).toBeVisible();
  });

  test("approves all low-risk proposed actions and enters monitoring", async ({ page }) => {
    const detail = new IncidentDetailPage(page);
    await detail.goto(MAIN_INCIDENT_ID);

    await expect(detail.approveAllLowRiskButton()).toBeVisible();
    await detail.approveAllLowRiskButton().click();
    await expect(detail.successAlert()).toBeVisible();
    await expect(page.getByText("Monitoring", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Pause cold-traffic Meta campaign")).toBeVisible();
    await expect(page.getByText("deployed", { exact: false }).first()).toBeVisible();
  });

  test("approves a single low-risk proposed action", async ({ page }) => {
    const detail = new IncidentDetailPage(page);
    await detail.goto(MAIN_INCIDENT_ID);

    const fitAssistantRow = page
      .locator("div")
      .filter({ hasText: "Enable fit assistant widget" })
      .filter({ has: detail.approveButtons() });
    const approve = fitAssistantRow.getByTestId("approve-action");
    await expect(approve).toBeVisible();
    await approve.click();
    await expect(detail.successAlert()).toBeVisible();
  });

  test("triggers investigation with stubbed API", async ({ page }) => {
    await page.route("**/api/investigate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const detail = new IncidentDetailPage(page);
    await detail.goto(E2E_DETECTED_INCIDENT_ID);
    await expect(page.getByRole("heading", { name: E2E_DETECTED_INCIDENT_TITLE })).toBeVisible();

    const investigation = page.locator("div").filter({
      has: detail.triggerInvestigationButton(),
    });

    await detail.triggerInvestigationButton().click();
    await expect(investigation.getByRole("alert")).toHaveCount(0);
    await expect(detail.triggerInvestigationButton()).not.toHaveAttribute("aria-busy", "true", {
      timeout: 15_000,
    });
  });

  test("returns not found for unknown incident ids", async ({ page }) => {
    await page.goto("/incidents/00000000-0000-0000-0000-000000009999");
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible();
  });
});
